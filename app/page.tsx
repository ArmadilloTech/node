"use client"
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { SyncLoader } from 'react-spinners'; // Import the SyncLoader component from react-spinners

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imagePath, setImagePath] = useState<string>('');
  const [gridNum, setGridNum] = useState<number>(50); // Default gridNum value
  const [outputWidth, setOutputWidth] = useState<number>(800); // Default outputWidth value

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true); // Start loading
    setImagePath(''); // Reset image path

    const formData = new FormData(event.currentTarget);
    formData.append('gridNum', String(gridNum)); // Add gridNum to form data
    formData.append('outputWidth', String(outputWidth)); // Add outputWidth to form data

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
      console.error('Failed to generate mosaic:', error);
      setIsLoading(false); // Stop loading in case of error
    }
  };

  const handleGridNumChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGridNum(Number(event.target.value));
  };

  const handleOutputWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOutputWidth(Number(event.target.value));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', textAlign: 'center', cursor: 'pointer' }}>
          <label htmlFor="mainImage">Main Image:</label>
          <input type="file" id="mainImage" name="mainImage" required />
          <br />
          <label htmlFor="tiles">Tile Images:</label>
          <input type="file" id="tiles" name="tiles" multiple required />
          <br />
          <label htmlFor="gridNum">Grid Number (1-100):</label>
          <input
            type="number"
            id="gridNum"
            name="gridNum"
            defaultValue="50"
            min="1"
            max="100"
            onChange={handleGridNumChange}
            style={{ color: 'black' }}
          />
          <br />
          <label htmlFor="outputWidth">Output Width PX:</label>
          <input
            type="number"
            id="outputWidth"
            name="outputWidth"
            defaultValue="800"
            min="1"
            max="10000"
            onChange={handleOutputWidthChange}
            style={{ color: 'black' }}
          />
          <br />
          <button type="submit" style={{ marginTop: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer' }}>Generate Mosaic</button>
        </div>
      </form>

      {isLoading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Loading...</p>
          <SyncLoader color="#007bff" size={10} /> {/* Add SyncLoader spinner component */}
        </div>
      )} {/* Display loading text and spinner */}
      {imagePath && <img src={imagePath} alt="Mosaic Result" style={{ display: 'block', marginTop: '20px', maxWidth: '100%' }} />} {/* Display the final image */}
    </div>
  );
}

export default Home;
