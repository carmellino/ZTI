import '../style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import axios from 'axios';

const SERVER_URL = "http://localhost:5000/"

const spotLightRedSlider = document.getElementById("SpotLightColorRedSlider");
const spotLightGreenSlider = document.getElementById("SpotLightColorGreenSlider");
const spotLightBlueSlider = document.getElementById("SpotLightColorBlueSlider");
const spotLightIntensitySlider = document.getElementById("SpotLightIntensitySlider");
const spotLightAngleSlider = document.getElementById("SpotLightAngleSlider");

const pointLightRedSlider = document.getElementById("PointLightColorRedSlider");
const pointLightGreenSlider = document.getElementById("PointLightColorGreenSlider");
const pointLightBlueSlider = document.getElementById("PointLightColorBlueSlider");
const pointLightIntensitySlider = document.getElementById("PointLightIntensitySlider");

const addSpotLightButton = document.getElementById("AddSpotLightButton");
const addPointLightButton = document.getElementById("AddPointLightButton");
const deleteSpotLLightButton = document.getElementById("DeleteSpotLightButton");
const deletePointLightButton = document.getElementById("DeletePointLightButton");

const previousModelButton = document.getElementById("PreviousModelButton");
const nextModelButton = document.getElementById("NextModelButton");

var fbxFiles = [];
var pointLights = [];
var spotLights = [];
var pointLightHelpers = [];
var spotLightHelpers = [];
var targetSpheres = [];

var loadedModel = null;
var loadedModelId = 0;
var activePointLightId = 0;
var activeSpotLightId = 0;
var foundPointLightIndex = null;
var foundSpotLightIndex = null;
var foundTargetSphereIndex = null;

var leftMouseButtonDown = false;
var clickTime = null;
var changingActiveSpotLight = false;
var changingActivePointLight = false;

const TARGET_SPHERE_GEOMETRY = new THREE.SphereGeometry(1,4,2);
const TARGET_SPHERE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(30);

const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#Canvas')});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;

const gridHelper = new THREE.GridHelper(200, 50);
const controls = new OrbitControls(camera, renderer.domElement);
const fbxLoader = new FBXLoader()

window.onload = async function()
{
  await getFbxFilesList();
  loadFbx(fbxFiles[0]);

  loadPointLights()
  setPointLightSlider(pointLights[activePointLightId]);
  loaSpotLights();
  setSpotLightSlider(spotLights[activeSpotLightId]);
  
  addThingsToSceneOnLoad();
  
  animate();
};

async function getFbxFilesList()
{
  console.log("getFbxFilesList()");

  await axios.get(SERVER_URL).then(response =>
  {
    fbxFiles = response.data;
    console.log("getFbxFilesList(): received: " + fbxFiles);
  }).catch(error =>
  {
    console.error('Error:', error);
  });

  console.log("getFbxFilesList() ended");
}

function loadPointLights()
{
  var numberOfPointlight = 2;
  for(let i = 0; i<numberOfPointlight; i++)
  {
    pointLights.push(new THREE.PointLight(0xFFFFFF, 1000, 0));
    pointLights[i].position.set(5,5,5);
    pointLights[i].castShadow = true;
  }

  for(let i in pointLights)
  {
    pointLightHelpers.push(new THREE.PointLightHelper(pointLights[i]));
  }

  activePointLightId = 0;
  pointLights[activePointLightId].position.set(0,10,0);
}

function loaSpotLights()
{  
  var numberOfSpotlight = 2;
  for(let i = 0; i<numberOfSpotlight; i++)
  {
    spotLights.push(new THREE.SpotLight(0xFFFFFF, 1000, 0));
    spotLights[i].position.set(15,15,15);
    spotLights[i].angle = 0.39;
    spotLights[i].castShadow = true;
  }

  for(let i in spotLights)
  {
    spotLightHelpers.push(new THREE.SpotLightHelper(spotLights[i]));
    targetSpheres.push(new THREE.Mesh(TARGET_SPHERE_GEOMETRY, TARGET_SPHERE_MATERIAL));
    targetSpheres[i].position.set(0,3,0);
    spotLights[i].target.position.copy(targetSpheres[i].position);
  }

  activeSpotLightId = 0;
  spotLights[activeSpotLightId].position.set(-15,15,15);
}

function addThingsToSceneOnLoad()
{
  for(let i in pointLights)
  {
    scene.add(pointLights[i]);
    scene.add(pointLightHelpers[i]);
  }
  
  for(let i in spotLights)
  {
    scene.add(spotLights[i]);
    scene.add(spotLightHelpers[i]);
    scene.add(targetSpheres[i]);
  }
  
  scene.add(gridHelper);
}

function animate()
{
  requestAnimationFrame(animate);
  
  if (!(changingActiveSpotLight || changingActivePointLight))
  {
    updateLights();
  }

  renderer.render(scene, camera);
  controls.update();
}

function updateLights()
{
  updatePointLight();
  updateSpotlight(); 
}

function updateSpotlight()
{
  if (activeSpotLightId < 0)
  {
    return;
  }
  
  spotLights[activeSpotLightId].color = sliderToColor(spotLightRedSlider, spotLightGreenSlider, spotLightBlueSlider);
  spotLights[activeSpotLightId].angle = spotLightAngleSlider.value/100;
  spotLights[activeSpotLightId].intensity = spotLightIntensitySlider.value;

  for(let i in spotLights)
  {
    spotLightHelpers[i].update();
    spotLights[i].target.position.copy(targetSpheres[i].position);
  }
}

function updatePointLight()
{
  if (activePointLightId < 0)
  {
    return;
  }

  pointLights[activePointLightId].color = sliderToColor(pointLightRedSlider, pointLightGreenSlider, pointLightBlueSlider);
  pointLights[activePointLightId].angle = spotLightAngleSlider.value/100;
  pointLights[activePointLightId].intensity = pointLightIntensitySlider.value;
}

function sliderToColor(red, green, blue)
{
  return new THREE.Color("rgb(" + Math.floor(red.value.toString()) + ", " + Math.floor(green.value.toString()) + ", " + Math.floor(blue.value.toString()) + ")");
}

function loadFbx(fileName)
{
  if (loadedModel != null)
  {
    scene.remove(loadedModel);
  }

  // blob żeby pobrać plik jako Blob
  axios.get(SERVER_URL + 'downloadFbx', {params: {filename: fileName}, responseType: 'blob'})
  .then(response =>
  {
    const url = URL.createObjectURL(response.data);
    fbxLoader.load(
      url,
      (object) =>
      {
        loadedModel = object;
        loadedModel.position.x = 0;
        loadedModel.position.y = 0;
        loadedModel.position.z = 0;
        loadedModel.traverse(function (child)
        {
          if (child.isMesh)
          {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const scale =  25 / Math.max(size.x, size.y, size.z);
        
        loadedModel.scale.set(scale, scale, scale);
        scene.add(loadedModel);
      },
      (xhr) =>
      {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      (error) =>
      {
        console.log(error)
      }
    );
  }).catch(error =>
  {
  console.error('Wystąpił błąd:', error);
  });
}

addEventListener('mousedown', function(event)
{
  if (event.button === 0)
  {
    clickTime = Date.now();
    console.log("Mouse button down");
    var mouse = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();
    
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);

    checkForPointLight(raycaster);
    checkForSpotLight(raycaster)
    checkForTargetSpheres(raycaster)
    mouseButtonHold(event);
    leftMouseButtonDown = true;
  }
});

function checkForPointLight(raycaster)
{
  var lightPosition = new THREE.Vector3();
  for(let i in pointLights)
  {
    pointLights[i].getWorldPosition(lightPosition);
    if (raycaster.ray.distanceToPoint(lightPosition) <= 0.8)
    {
      console.log("PointLight " + i + " found");
      foundPointLightIndex = i;
    }
  }
}

function checkForSpotLight(raycaster)
{
  var lightPosition = new THREE.Vector3();
  for(let i in spotLights)
  {
    spotLights[i].getWorldPosition(lightPosition);
    if (raycaster.ray.distanceToPoint(lightPosition) <= 0.6)
    {
      console.log("Spotlight " + i + " found");
      foundSpotLightIndex = i;
    }
  } 
}

function checkForTargetSpheres(raycaster)
{
  for(let i in targetSpheres)
  {
    if (raycaster.intersectObject(targetSpheres[i]).length > 0)
    {
      foundTargetSphereIndex = i;
      console.log("Clicked on target sphere");
    }
  }
}

addEventListener('mouseup', function(event)
{
  if (event.button === 0)
  {
    console.log("Mouse button up");
    leftMouseButtonDown = false;
    foundPointLightIndex = null;
    foundSpotLightIndex = null;
    foundTargetSphereIndex = null;
  }
});

function mouseButtonHold(event)
{
  if (Date.now() - clickTime > 200)
  {
    return;
  }

  console.log("mouse button is being hold")
  if (foundPointLightIndex !== null)
  {
    console.log("PointLight " + foundPointLightIndex + " Clicked");
    changeActivePointLight(foundPointLightIndex);
  }
  else if (foundSpotLightIndex !== null)
  {
    console.log("SpotLight " + foundSpotLightIndex + " Clicked");
    
    changeActiveSpotLight(foundSpotLightIndex);
  }
  else if (foundTargetSphereIndex != null)
  {
    console.log("TargetSphere " + foundTargetSphereIndex + " Clicked");
    
    changeActiveSpotLight(foundTargetSphereIndex);
  }
};

addEventListener('mousemove', function(event)
{
  //event.button === 0 to lewy
  if (!leftMouseButtonDown || !event.button === 0)
  {
    controls.enabled = true;
    return;
  }
  
  if (foundPointLightIndex !== null)
  {
    changingActivePointLight = true;
    moveTarget(event, pointLights[foundPointLightIndex]);
    changingActivePointLight = false;
  }
  else if (foundSpotLightIndex !== null)
  {
    changingActiveSpotLight = true;
    moveTarget(event, spotLights[foundSpotLightIndex]);
    changingActiveSpotLight = false;
  }
  else if (foundTargetSphereIndex !== null)
  {
    moveTarget(event, targetSpheres[foundTargetSphereIndex]);
  }
});

function moveTarget(event, target)
{
  controls.enabled = false;

  var mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
  mouse3D.unproject(camera);

  var dir = mouse3D.sub(camera.position).normalize();
  var distance = target.position.distanceTo(camera.position);
  var targetPosition = camera.position.clone().add(dir.multiplyScalar(distance));

  target.position.copy(targetPosition);
}

function changeActivePointLight(pointLightIndex)
{
  if (pointLightIndex >= 0)
  {
    setPointLightSlider(pointLights[pointLightIndex]);
  }
  activePointLightId = pointLightIndex;
}

function changeActiveSpotLight(spotLightIndex)
{
  if (spotLightIndex >= 0)
  {
    setSpotLightSlider(spotLights[spotLightIndex]);
  }
  activeSpotLightId = spotLightIndex;
}

function setSpotLightSlider(spotLight)
{
  spotLightIntensitySlider.value =  spotLight.intensity;
  spotLightAngleSlider.value = spotLight.angle * 100;

  var hexColor = spotLight.color.getHexString();
  spotLightRedSlider.value = parseInt(hexColor.substring(0, 2), 16);
  spotLightGreenSlider.value = parseInt(hexColor.substring(2, 4), 16);
  spotLightBlueSlider.value = parseInt(hexColor.substring(4, 6), 16);
}

function setPointLightSlider(pointLight)
{
  pointLightIntensitySlider.value =  pointLight.intensity;

  var hexColor = pointLight.color.getHexString();
  pointLightRedSlider.value = parseInt(hexColor.substring(0, 2), 16);
  pointLightGreenSlider.value = parseInt(hexColor.substring(2, 4), 16);
  pointLightBlueSlider.value = parseInt(hexColor.substring(4, 6), 16);
}

addSpotLightButton.addEventListener("click", function()
{
  const newSpotLightId = spotLights.length;
  console.log("Adding SpotLight with id: " + newSpotLightId);
  spotLights.push(new THREE.SpotLight(0xFFFFFF, 1000, 0));
  spotLights[newSpotLightId].position.set(0,20,0);
  spotLights[newSpotLightId].castShadow = true;
  spotLights[newSpotLightId].angle = 0.39;

  spotLightHelpers.push(new THREE.SpotLightHelper(spotLights[newSpotLightId]));

  targetSpheres.push(new THREE.Mesh(TARGET_SPHERE_GEOMETRY, TARGET_SPHERE_MATERIAL));
  targetSpheres[newSpotLightId].position.set(0,5,0);
  spotLights[newSpotLightId].target.position.copy(targetSpheres[newSpotLightId].position);

  scene.add(spotLights[newSpotLightId]);
  scene.add(spotLightHelpers[newSpotLightId]);
  scene.add(targetSpheres[newSpotLightId]);
  changeActiveSpotLight(newSpotLightId);
})


addPointLightButton.addEventListener("click", function()
{
  const newPointLightId = pointLights.length;
  console.log("Adding PointLight with id: " + newPointLightId);
  
  pointLights.push(new THREE.PointLight(0xFFFFFF, 1000, 0));
  pointLights[newPointLightId].position.set(0,15,0);
  pointLights[newPointLightId].castShadow = true;

  pointLightHelpers.push(new THREE.PointLightHelper(pointLights[newPointLightId]));
  scene.add(pointLights[newPointLightId]);
  scene.add(pointLightHelpers[newPointLightId]);
  changeActivePointLight(newPointLightId);
})

deleteSpotLLightButton.addEventListener("click", function()
{
  console.log("Deleting SpotLight with id: " + activeSpotLightId);
  scene.remove(spotLights[activeSpotLightId]);
  scene.remove(spotLightHelpers[activeSpotLightId]);
  scene.remove(targetSpheres[activeSpotLightId]);

  spotLights.splice(activeSpotLightId, 1);
  spotLightHelpers.splice(activeSpotLightId, 1);
  targetSpheres.splice(activeSpotLightId, 1);

  changeActiveSpotLight(spotLights.length - 1);
})

deletePointLightButton.addEventListener("click", function()
{
  console.log("Deleting PointLight with id: " + activePointLightId);
  scene.remove(pointLightHelpers[activePointLightId]);
  scene.remove(pointLights[activePointLightId]);
  
  pointLightHelpers.splice(activePointLightId, 1);
  pointLights.splice(activePointLightId, 1);
  changeActivePointLight(pointLights.length - 1);
})

nextModelButton.addEventListener("click", function()
{
  if (loadedModelId >= fbxFiles.length - 1)
  {
    return;
  }

  loadFbx(fbxFiles[loadedModelId + 1]);
  loadedModelId += 1;
})

previousModelButton.addEventListener("click", function()
{
  if (loadedModelId < 1)
  {
    return;
  }
  
  loadFbx(fbxFiles[loadedModelId - 1]);
  loadedModelId -= 1;
})

