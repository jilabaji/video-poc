import React, { useState } from 'react';
import { Upload, RefreshCw } from 'lucide-react';

export default function VideoOptimizer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState('ffmpeg');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('method', method);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Video Optimizer</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Optimization Method:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="ffmpeg">FFmpeg</option>
                <option value="handbrake">HandBrake</option>
              </select>
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Click to upload video</p>
              </label>
            </div>

            {file && (
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  'Optimize Video'
                )}
              </button>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-bold">Results</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Original Video</h3>
                <p>Size: {formatSize(result.originalSize)}</p>
                <video
                  src={result.originalUrl}
                  controls
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <h3 className="font-semibold">Optimized Video</h3>
                <p>Size: {formatSize(result.optimizedSize)}</p>
                <video
                  src={result.optimizedUrl}
                  controls
                  className="w-full mt-2"
                />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <p className="text-green-700">
                Size reduction: {result.reduction}%
              </p>
              <p className="text-green-600 text-sm">
                Saved {formatSize(result.originalSize - result.optimizedSize)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}