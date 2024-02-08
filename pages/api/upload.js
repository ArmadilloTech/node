// Import necessary modules
import multer from 'multer';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Photosaic from 'photosaic';

// Define the new output path for storing mosaic images
// Adjust the path as necessary based on your project structure
const mosaicOutputPath = path.join(__dirname, '..', 'public', 'mosaics');
// Ensure the mosaic output path exists
fs.mkdirSync(mosaicOutputPath, { recursive: true });

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use the OS temporary directory for initial file uploads
    const uploadPath = os.tmpdir();
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique file name for each uploaded file
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const uploadMiddleware = promisify(upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'tiles', maxCount: 50 }]));

// Configuration to disable body parsing, since multer will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// The API handler function
export default async function handler(req, res) {
  try {
    // Await the multer upload middleware to handle file upload
    await uploadMiddleware(req, res);

    // Verify that the required files were uploaded
    if (!req.files.mainImage || !req.files.tiles) {
      return res.status(400).send('No files uploaded.');
    }

    // Paths for the uploaded images
    const mainImagePath = req.files.mainImage[0].path;
    const tilesPaths = req.files.tiles.map(file => file.path);
    const options = {
      gridNum: 30, // Increase for more detail
      intensity: 0.5, // Adjust if necessary, but 0.5 is generally a good starting point
      outputType: 'png', // Keep as 'png' for transparency support
      outputWidth: 600, // Increase for a larger, more detailed mosaic
      algo: 'closestColor', // Recommended for better definition
    };
    
    // Use Photosaic to generate the mosaic

    const mosaic = Photosaic(mainImagePath, tilesPaths, options);

    const finalMosaicBuffer = await mosaic.build();

    // Define the path for saving the final mosaic image, using the new output path
    const projectRoot = process.env.PROJECT_ROOT;
    const finalMosaicFilename = `finalMosaic-${Date.now()}.png`;

    const finalMosaicPath = path.join(projectRoot, 'public', 'mosaics', `finalMosaic-${Date.now()}.png`);    await fs.promises.writeFile(finalMosaicPath, finalMosaicBuffer);

    const webAccessiblePath = `/mosaics/${finalMosaicFilename}`;

    // Respond with the path to the generated mosaic image
    // Adjust the response as needed, for example, to return a URL to the image if serving over the web
    res.status(200).json({
      message: 'Mosaic generated successfully.',
      path: webAccessiblePath
    });
      } catch (error) {
    console.error('Failed to upload files:', error);
    res.status(500).json({ error: 'Server error during file upload.' });
  }
}
