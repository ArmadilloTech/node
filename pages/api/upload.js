// Import necessary modules
import multer from "multer";
import { promisify } from "util";
import os from "os";
import path from "path";
import Photosaic from "photosaic";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the OS temporary directory for initial file uploads
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    // Generate a unique file name for each uploaded file
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage: storage });
const uploadMiddleware = promisify(
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "tiles", maxCount: 50 },
  ])
);

// Configuration to disable body parsing, since multer will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// The API handler function
// API Endpoint
// The API handler function
export default async function handler(req, res) {
  try {
    // Await the multer upload middleware to handle file upload
    await uploadMiddleware(req, res);

    // Verify that the required files were uploaded
    if (!req.files.mainImage || !req.files.tiles) {
      return res.status(400).send("No files uploaded.");
    }

    // Get the gridNum parameter from the request body
    const gridNum = parseInt(req.body.gridNum, 10);

    // Validate the gridNum parameter
    if (isNaN(gridNum) || gridNum < 1 || gridNum > 100) {
      return res.status(400).send("Invalid gridNum parameter.");
    }

    const outputWidth = parseInt(req.body.outputWidth, 10);
    if (isNaN(outputWidth) || outputWidth < 1) {
      // Add more validation as needed
      return res.status(400).send("Invalid outputWidth parameter.");
    }

    // Paths for the uploaded images
    const mainImagePath = req.files.mainImage[0].path;
    const tilesPaths = req.files.tiles.map((file) => file.path);
    const options = {
      gridNum: gridNum,
      intensity: 0.5,
      outputType: "png",
      outputWidth: outputWidth,
      algo: "closestColor",
    };

    // Use Photosaic to generate the mosaic
    const mosaic = Photosaic(mainImagePath, tilesPaths, options);
    const finalMosaicBuffer = await mosaic.build();

    // Upload the mosaic buffer to Vercel Blob Storage
    const blobret = await put(
      `finalMosaic-${Date.now()}.png`,
      finalMosaicBuffer,
      {
        access: "public",
      }
    );

    // Assuming you have a way to generate a public URL for the uploaded blob
    // This URL generation method depends on how Vercel Blob Storage manages URLs for stored blobs

    // Return the public URL in the response
    res.status(200).json({
      message: "Mosaic generated successfully.",
      path: blobret.url,
    });
  } catch (error) {
    console.error("Failed to process files:", error);
    res.status(500).json({ error: "Server error during file processing." });
  }
}

// Add the following code to your API routes
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  // Upload the avatar to Vercel Blob Storage
  const blob = await put(filename, request.body, {
    access: "public",
  });

  return NextResponse.json(blob);
}
