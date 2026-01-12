# Public Assets Folder

This folder is for static assets that will be served directly by the web server.

## Models Directory

The `models` directory is specifically for 3D model files like `.glb` models. 

### Usage

1. Upload your `.glb` files to the `models` directory
2. Access them in your application at `/models/your-model.glb`

Example:
```javascript
// In your React component
const modelUrl = '/models/your-model.glb';
```