import { v2 as cloudinary } from "cloudinary";

// Cloudinary lee CLOUDINARY_URL desde .env:
// cloudinary://API_KEY:API_SECRET@CLOUD_NAME
cloudinary.config({
  secure: true,
});

export { cloudinary };
