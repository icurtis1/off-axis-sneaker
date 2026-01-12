# Head-Coupled Perspective Display

A real-time 3D perspective effect that responds to your head movements, built with React, Three.js, and MediaPipe. Inspired by Johnny Chung Lee's Wii Remote head tracking demo, this application creates the illusion of looking through a window into a 3D scene by tracking your face position and adjusting the camera perspective accordingly.

<img src="./public/media/demo.gif" alt="Demo" width="800" />

## Features

- Real-time head tracking using MediaPipe Face Mesh
- Dynamic 3D perspective adjustment with Three.js
- Calibration wizard for personalized viewing experience
- 3D model viewer with interactive controls
- Debug mode for visualizing frustum and tracking data
- Smooth motion interpolation for natural movement
- Fullscreen support
- Clean, modern UI with Tailwind CSS

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety and better developer experience
- **Three.js** - 3D graphics and rendering
- **MediaPipe** - ML-powered face detection and landmark tracking
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling

## Getting Started

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/         # React components
│   ├── CalibrationWizard.tsx
│   ├── CameraPermission.tsx
│   ├── FaceMeshView.tsx
│   ├── ShoeControlPanel.tsx
│   └── ThreeView.tsx
├── hooks/             # Custom React hooks
│   ├── useFaceLandmarker.ts
│   └── useFaceMesh.ts
├── utils/            # Utility functions
│   ├── calibration.ts
│   ├── headPose.ts
│   ├── offAxisCamera.ts
│   └── threeScene.ts
├── App.tsx           # Main application component
└── main.tsx         # Application entry point
```

## How It Works

1. **Face Tracking**: MediaPipe Face Mesh detects your face and tracks 468 facial landmarks in real-time through your webcam.

2. **Head Pose Estimation**: Key facial landmarks (eyes, nose) are used to calculate your head position in 3D space (x, y, z coordinates).

3. **Calibration**: An initial calibration step measures your screen size and viewing distance to ensure accurate perspective mapping.

4. **Camera Adjustment**: As you move your head, the Three.js camera perspective adjusts to create the illusion that you're looking through a window into a 3D scene.

5. **Real-time Rendering**: The 3D scene updates smoothly at 30-60 FPS, with motion smoothing to reduce jitter while maintaining responsiveness.

## Calibration

On first launch, you'll be guided through a quick calibration process:

1. Measure your physical screen dimensions
2. Position your face at a comfortable viewing distance
3. The system calculates the optimal perspective parameters

You can recalibrate anytime using the settings button in the bottom left corner.

## Controls

- **Fullscreen Toggle**: Enter/exit fullscreen mode
- **Settings**: Open calibration wizard
- **Debug Mode**: View frustum visualization and tracking data
- **Model Controls**: Adjust 3D model position, scale, and rotation

## Use Cases

<img src="./public/media/example.gif" alt="Example" width="800" />

- **Product Visualization**: Showcase 3D products with an immersive viewing experience
- **Virtual Showrooms**: Create engaging virtual display cases
- **Interactive Art**: Build installations that respond to viewer movement
- **Education**: Visualize complex 3D concepts with enhanced depth perception
- **Gaming**: Implement head tracking for enhanced immersion
- **Research**: Study spatial perception and human-computer interaction

## Technical Details

This implementation uses a parallax camera effect that translates the camera position based on head movement. For more advanced implementations, see `HEAD_COUPLED_PERSPECTIVE.md` which describes how to implement true off-axis projection with custom frustum calculation for geometrically-correct perspective rendering.

### Head Position Mapping

- **X-axis**: Horizontal head movement maps to horizontal camera translation
- **Y-axis**: Vertical head movement maps to vertical camera translation (inverted)
- **Z-axis**: Depth estimate from face size maps to camera distance

### Smoothing

Exponential moving average (EMA) with adjustable smoothing factor reduces jitter while maintaining responsiveness.

## Browser Support

This application requires a modern browser with support for:
- WebGL 2.0
- WebAssembly
- getUserMedia API
- Canvas API
- Fullscreen API

Tested on Chrome, Firefox, Edge, and Safari.

## Acknowledgments

- [Johnny Chung Lee](https://www.cs.cmu.edu/~johnny/projects/wii/) for pioneering head tracking displays
- [MediaPipe](https://developers.google.com/mediapipe) for ML-powered face tracking
- [Three.js](https://threejs.org/) for 3D graphics
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for the build tool