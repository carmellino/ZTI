const express = require('express');
const mongodbClient = require('./mongodbClient.js')
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 5000;
const TMP_FBX_FILE_PATH = '/home/diego/studia/zti1/ZTI/Server/fbxTempDir/tmp.fbx';

app.listen(PORT, () =>
{
  console.log(`Listening on port ${PORT}`);
})

app.get("/", async(req, res) =>
{
  res.header("Access-Control-Allow-Origin", "*");
  var names = [];
  await mongodbClient.start();
  names = await mongodbClient.getFbxModelsList();
  res.send(names);
});

app.get('/downloadFbx', async (req, res) =>
{
  console.log("app.get: '/downloadFbx'");

  const fileName = req.query.filename;
  console.log("req.query.filename: " + fileName);

  await mongodbClient.getFbxModel(fileName).catch(console.error);
  if (fs.existsSync(TMP_FBX_FILE_PATH))
  {
    console.log("app.get: '/downloadFbx', file found");
    res.setHeader('Content-Disposition', 'attachment; filename="tmp.fbx"');

    fs.createReadStream(TMP_FBX_FILE_PATH).pipe(res);
  }
  else
  {
    res.status(404).send('File not found');
  }

  req.on('end', () =>
  {
    fs.unlink(TMP_FBX_FILE_PATH, (err) =>
    {
      if (err)
      {
        console.error('Failed to delete file: ', err);
        return;
      }
      console.log('File deleted');
    });
  });
});
