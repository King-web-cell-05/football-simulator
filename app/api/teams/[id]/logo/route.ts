
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ==========================================
// FOOTBALLSIM BACKEND CONFIGURATION
// ==========================================

const API_URL = (
  process.env.FOOTBALLSIM_API_URL ??
  "http://localhost:5295"
).replace(/\/$/, "");

// ==========================================
// CONFIGURATION
// ==========================================

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
]);

// ==========================================
// TYPES
// ==========================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// ==========================================
// AUTHENTICATION
// ==========================================

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return (
    cookieStore.get("footballsim_session")?.value ??
    null
  );
}

// ==========================================
// VALIDATE TEAM ID
// ==========================================

function isValidGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ==========================================
// READ BACKEND RESPONSE
// ==========================================

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

// ==========================================
// CHECK IMAGE SIGNATURE
// ==========================================

function hasValidImageSignature(
  bytes: Uint8Array,
  mimeType: string
): boolean {
  if (mimeType === "image/png") {
    const signature = [
      137, 80, 78, 71, 13, 10, 26, 10,
    ];

    return (
      bytes.length >= 8 &&
      signature.every(
        (value, index) => bytes[index] === value
      )
    );
  }

  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) ===
        "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) ===
        "WEBP"
    );
  }

  return false;
}

// ==========================================
// UPLOAD TEAM LOGO
// POST /api/teams/{id}/logo
// ==========================================

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // --------------------------------------
    // VALIDATE TEAM ID
    // --------------------------------------

    const { id } = await context.params;

    if (!isValidGuid(id)) {
      return NextResponse.json(
        {
          message: "Invalid team ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // AUTHENTICATION
    // --------------------------------------

    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized. Please sign in.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------
    // READ FORM DATA
    // --------------------------------------

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          message: "Invalid multipart form data.",
        },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "Please select a club logo.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // VALIDATE FILE SIZE
    // --------------------------------------

    if (file.size === 0) {
      return NextResponse.json(
        {
          message: "The selected file is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Club logo must not exceed 2 MB.",
        },
        { status: 413 }
      );
    }

    // --------------------------------------
    // VALIDATE IMAGE TYPE
    // --------------------------------------

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          message:
            "Only PNG, JPG, and WebP images are allowed.",
        },
        { status: 400 }
      );
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !ALLOWED_EXTENSIONS.has(extension)
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid image extension. Use PNG, JPG, or WebP.",
        },
        { status: 400 }
      );
    }

    const matchesExtension =
      (file.type === "image/png" &&
        extension === "png") ||
      (file.type === "image/jpeg" &&
        ["jpg", "jpeg"].includes(extension)) ||
      (file.type === "image/webp" &&
        extension === "webp");

    if (!matchesExtension) {
      return NextResponse.json(
        {
          message:
            "The image extension does not match its type.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // VALIDATE IMAGE HEADER
    // --------------------------------------

    const header = new Uint8Array(
      await file.slice(0, 12).arrayBuffer()
    );

    if (!hasValidImageSignature(header, file.type)) {
      return NextResponse.json(
        {
          message:
            "Invalid image file. Please select a valid club crest.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------
    // FORWARD IMAGE TO ASP.NET CORE
    // --------------------------------------

    const uploadFormData = new FormData();

    uploadFormData.append(
      "file",
      file,
      file.name
    );

    const response = await fetch(
      `${API_URL}/api/Teams/${id}/logo`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: uploadFormData,
        cache: "no-store",
      }
    );

    // Do not manually set Content-Type.
    // Fetch generates the multipart boundary.

    const data = await readResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(
      "FootballSim team logo upload error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Unable to upload the club logo. Please try again.",
      },
      { status: 502 }
    );
  }
}
