const mongodb = require('mongodb');
const util = require('util');
const fs = require('fs');
const fsReadFile = util.promisify(fs.readFile);

const tmpFbxFilePath = "/home/diego/studia/zti1/ZTI/Server/fbxTempDir/tmp.fbx";
const uriPath = "/home/diego/studia/zti1/ZTI/Server/uri.txt"
var client = null;

async function start()
{
  console.log("start(): start");
  try
  {
    const uri = await fsReadFile(uriPath, {encoding: 'utf8'});
    client = new mongodb.MongoClient(uri);
  }
  catch (error)
  {
    console.error("Failed to read uri from file.", error);
  }
  console.log("start(): end");
}

async function getFbxModel(filename)
{
  console.log("getFbxModel(" + filename + ") start");
  try
  {
    await client.connect();
    console.log("Connection to mongo established");
    await getFbx(filename);
  }
  catch (e)
  {
    console.error(e);
    console.log("Connection to mongo failed");
  }
  finally
  {
    setTimeout(async () => {await client.close()}, 1500);
    console.log("Connection to mongo closed");
  }
  console.log("getFbxModel() end");
}

async function getFbx(fileName)
{
  console.log("getFbx(" + fileName + "): start");
  const db = client.db("test");
  const bucket = new mongodb.GridFSBucket(db);
  const cursor = bucket.find({});
  for await (const doc of cursor)
  {
    console.log(doc);
    if(fileName == doc.filename)
    {
      console.log("getFbx(" + fileName + "): found it");
      const writeStream = bucket.openDownloadStreamByName(fileName).pipe(fs.createWriteStream(tmpFbxFilePath));
      await new Promise((resolve) =>
      {
        writeStream.on('finish', resolve);
      });
      console.log('Plik został pomyślnie zapisany na dysku');
    }
  }
  console.log("getFbx(" + fileName + "): end");
}

async function getFbxModelsList()
{
  console.log("getFbxModels() start");
  var names = [];
  try
  {
    await client.connect();
    console.log("Connection to mongo established");
    await getFbxNamesList().then(result => {names = result});
    
  }
  catch (e)
  {
    console.error(e);
    console.log("Connection to mongo failed");
  }
  finally
  {
    setTimeout(() => {client.close()}, 1500);
    console.log("Connection to mongo closed");
  }
  console.log("getFbxModels() end");
  return names;
}

async function getFbxNamesList()
{
  console.log("getFbxNamesList() start");
  const db = client.db("test");
  const bucket = new mongodb.GridFSBucket(db);
  const cursor = bucket.find({});
  var names = [];
  for await (const doc of cursor)
  {
    names.push(doc.filename);
  }
    
  console.log("getFbxNamesList() end");
  return names;
}


module.exports = {start, getFbxModelsList, getFbxModel};