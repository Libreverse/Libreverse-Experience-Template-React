# Libreverse Experience Template

A template for creating 3D metaverse experiences using React, React Three Fiber, Three.js, and WebXR. This template is designed to be lightweight, extensible, and builds to a single HTML file for easy deployment.

## Features

- 🎮 Interactive 3D scene with basic objects and animations
- 🕹️ First-person camera controls with mouse/touch support
- 🥽 WebXR integration for VR experiences
- 🎨 Modern UI overlay with instructions
- 📱 Responsive design for desktop and mobile
- 📦 Builds to a single HTML file
- 🌐 **Multiplayer Support** - Real-time multiplayer via ActionCable integration with Libreverse
- 👥 Multi-user sessions with synchronized player movements
- 🤝 Shared object interactions across connected clients

## Prerequisites

- [Bun](https://bun.sh/) 1.0 or higher
- A modern web browser with WebGL support
- (Optional) A WebXR-compatible VR headset

## Getting Started

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd libreverse-experience-template
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Start the development server:

   ```bash
   bun run dev
   ```

4. Build for production:
   ```bash
   bun run build
   ```

The production build will create a single `index.html` file in the `dist` directory with all assets inlined.

## Testing

This project uses Bun's built-in test runner for fast, zero-configuration testing:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

Test files are located in `src/__tests__/` and follow the pattern `*.test.{ts,tsx}`.

## Bun Configuration

The project includes a `bunfig.toml` file for Bun-specific configuration:

- Test setup and DOM environment configuration
- Coverage reporting
- Test file patterns and timeouts

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run test` - Run test suite
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier

## Project Structure

```
src/
  ├── App.tsx        # Main application component
  ├── Scene.tsx      # 3D scene and object definitions
  ├── index.tsx      # Application entry point
  └── index.scss      # Global styles
```

## Extending the Template

### Adding New 3D Objects

Create new components in `Scene.tsx`:

```jsx
function CustomObject({ position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  );
}
```

### Adding Interactions

Use the `Interactive` component from `@react-three/xr`:

```jsx
<Interactive onSelect={() => console.log("clicked")}>
  <CustomObject position={[0, 1, 0]} />
</Interactive>
```

### Customizing VR Controls

Modify the Controllers component in `App.tsx`:

```jsx
<Controllers rayMaterial={{ color: "#ff0000" }} />
```

### Adding Custom Textures

1. Add texture files to the `public` directory
2. Import and use in your materials:

```jsx
import { useTexture } from "@react-three/drei";

function TexturedObject() {
  const texture = useTexture("/path/to/texture.jpg");
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
```

## WebXR Support

The template includes WebXR support out of the box. The VR button will appear automatically when a compatible device is detected. To test VR features:

1. Use a WebXR-compatible browser (Chrome, Edge, Firefox)
2. Connect a VR headset
3. Click the "Enter VR" button that appears

## Performance Tips

- Use `useFrame` sparingly and optimize animations
- Implement level-of-detail (LOD) for complex objects
- Use texture compression for production builds
- Consider implementing object pooling for many dynamic objects

## Multiplayer Support

This template includes real-time multiplayer functionality via ActionCable integration with the Libreverse Rails application.

### Features

- **Real-time Player Synchronization**: See other players move around in real-time
- **Shared Object Interactions**: Interactive objects are synchronized across all connected clients
- **Session-based Multiplayer**: Players join specific session rooms
- **Connection Status Indicator**: Visual feedback showing connection status and player count

### Setup

1. **Rails Server Setup**: Follow the instructions in `MULTIPLAYER_SETUP.md` to configure the Libreverse Rails application with ActionCable support.

2. **Start the Rails Server**:

   ```bash
   cd /Users/george/Libreverse
   bundle exec rails server
   ```

3. **Start the React Development Server**:

   ```bash
   bun run dev
   ```

4. **Test Multiplayer**: Open multiple browser tabs or windows to see real-time synchronization.

### Configuration

The multiplayer system is configured in `src/Scene.tsx`. Key settings:

- **WebSocket URL**: Update to match your Rails server
- **Session Management**: Each instance creates a unique session ID
- **Player Identification**: Automatic unique player ID and color generation

### Architecture

- **ActionCable Service** (`src/p2p/actionCableService.ts`): Handles WebSocket communication
- **React Hook** (`src/p2p/useActionCable.ts`): Provides easy React integration
- **Types** (`src/p2p/types.ts`): TypeScript definitions for multiplayer data structures

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

AGPL License, just like Libreverse.

## Acknowledgments

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js](https://threejs.org/)
- [WebXR Device API](https://immersive-web.github.io/webxr/)
