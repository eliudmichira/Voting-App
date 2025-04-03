// Native platform entry point
// Import polyfills first
import './shim.js';

// Register the app
import { registerRootComponent } from 'expo';
import App from './App';

// Register the root component
registerRootComponent(App);
