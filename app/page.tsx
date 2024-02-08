// Inside a React component file, e.g., app/page/index.js
"use client"
import React, { useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePath, setImagePath] = useState('');

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    setIsLoading(true); // Start loading
    setImagePath(''); // Reset image path

    const formData = new FormData(event.target);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log(result);

      if (result.path) {
        // Assuming the API returns a full URL or a relative path that the browser can access
        setImagePath(result.path);
      }
      setIsLoading(false); // Stop loading
    } catch (error) {
      console.error("Failed to generate mosaic:", error);
      setIsLoading(false); // Stop loading in case of error
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div>
          <label htmlFor="mainImage">Main Image:</label>
          <input type="file" id="mainImage" name="mainImage" required />
        </div>
        <div>
          <label htmlFor="tiles">Tile Images:</label>
          <input type="file" id="tiles" name="tiles" multiple required />
        </div>
        <button type="submit">Generate Mosaic</button>
      </form>

      {isLoading && <div>Loading...</div>} {/* Display loading indicator */}
      {imagePath && <img src={imagePath} alt="Mosaic Result" />} {/* Display the final image */}
    </div>
  );
}
