import * as React from 'react';
import { useRef } from "react";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Asset } from 'expo-asset';
import { Renderer } from 'expo-three';
import { PanResponder } from 'react-native';
import {
  AmbientLight,
  Fog,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
} from 'three';
import { GLView } from 'expo-gl';

export default function App() {
  let timeout;
  const rotation = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const zoom = useRef(1);

  const handleZoom = (event, gestureState) => {
    const touches = event.nativeEvent.touches;
    if (touches.length >= 2) {
      const { dy } = gestureState;
      const zoomFactor = 0.005;
      zoom.current = zoom.current + dy * zoomFactor;
    }
  }

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: handleZoom,
    })
  ).current;

  const handleInitialize = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const sceneColor = 668096;
    // Create a WebGLRenderer without a DOM element
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x668096);

    const scene = new Scene();
    scene.fog = new Fog(sceneColor, 1, 10000);

    const ambientLight = new AmbientLight(0x101010);
    scene.add(ambientLight);

    const pointLight = new PointLight(0xffffff, 2, 1000, 1);
    pointLight.position.set(0, 200, 200);
    scene.add(pointLight);

    const spotLight = new SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 500, 100);
    spotLight.lookAt(scene.position);
    scene.add(spotLight);

    const asset = Asset.fromModule(require("./assets/lively-test.obj"));
    await asset.downloadAsync();

    // instantiate a loader
    const loader = new OBJLoader();
    // load a resource
    loader.load(
      // resource URL
      asset.uri,
      // called when resource is loaded
      function ( object ) {
        object.scale.set(0.001, 0.001, 0.001)
        scene.add( object );

        function update() {
          object.rotation.x = rotation.current.x;
          object.rotation.y = rotation.current.y;
          object.rotation.z = 0;
        }

        const render = () => {
          timeout = requestAnimationFrame(render);
          const camera = new PerspectiveCamera(100 / zoom.current, width / height, 0.01, 1000);
          camera.position.set(1, 1, 1 / zoom.current);
          camera.lookAt(object.position)
          update();
          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        render();
      },

      // called when loading is in progresses
      function ( xhr ) {
        // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      // called when loading has errors
      function ( error ) {
        console.log( 'error', error );
      }
    );
  }

  const handleTouchStart = (event) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 1) {
      last.current = {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      };
    }
  }

  const handleTouchMove = (event) => {
    const touches = event.nativeEvent.touches;
    if (touches.length === 1) {
      const {x, y} = last.current;
      const dx = event.nativeEvent.locationX - x;
      const dy = event.nativeEvent.locationY - y;
      rotation.current.y += dx * 0.01;
      rotation.current.x += dy * 0.01;
      last.current = {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      };
    }
  }

  React.useEffect(() => {
    return () => clearTimeout(timeout);
  }, []);

  return (
    <GLView
      style={{ flex: 1 }}
      {...panResponder.panHandlers}
      onContextCreate={handleInitialize}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    />
  );
}
