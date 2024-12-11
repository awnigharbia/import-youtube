const fetch = require('node-fetch');

const API_ACCESS_KEY = '70044ab7-cc78-4a47-8c7c-68987111cbd5';

async function getStreamLibraries() {
  const url = 'https://api.bunny.net/videolibrary?page=1&perPage=1000&includeAccessKey=false';
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', AccessKey: API_ACCESS_KEY }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data.Items.map(item => item.Id);
  } catch (error) {
    console.error('Error fetching stream libraries:', error);
    return [];
  }
}

async function getPullZone(id) {
  const url = `https://api.bunny.net/pullzone/${id}?includeCertificate=false`;
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', AccessKey: API_ACCESS_KEY }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.status !== 200) {
      console.error(`Error fetching pull zone for stream library ID ${id}:`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching pull zone for stream library ID ${id}:`);
    return null;
  }
}

async function addHostnameToPullZone(id, hostname) {
  const url = `https://api.bunny.net/pullzone/${id}/addHostname`;
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      AccessKey: API_ACCESS_KEY
    },
    body: JSON.stringify({ Hostname: hostname })
  };

  try {
    const response = await fetch(url, options);
    // const data = await response.json();
    console.log(`Hostname added to pull zone ${id}:`);
  } catch (error) {
    console.error(`Error adding hostname to pull zone ${id}:`);
  }
}
async function addWebhookToLibrary(id) {
  const url = `https://api.bunny.net/videolibrary/${id}`;
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      AccessKey: '70044ab7-cc78-4a47-8c7c-68987111cbd5'
    },
    body: JSON.stringify({ BlockNoneReferrer: false })
  };


  try {
    const response = await fetch(url, options);
    // const data = await response.json();
    console.log(`Webhook added to pull zone ${id}:`);
  } catch (error) {
    console.error(`Error adding hostname to pull zone ${id}:`);
  }
}

async function processLibraries() {
  const libraries = await getStreamLibraries();

  for (const libraryId of libraries) {
    await addWebhookToLibrary(libraryId);

    // const pullZone = await getPullZone(libraryId);
    // if (!pullZone) continue;

    // const hostnames = pullZone.Hostnames;
    // let hasBecdnDomain = false;
    // let bCdnHostname = null;

    // // Check if there's a hostname with becdn.net domain
    // for (const hostname of hostnames) {
    //   if (hostname.Value.includes('becdn.net')) {
    //     hasBecdnDomain = true;
    //     break;
    //   }
    //   if (hostname.Value.includes('b-cdn.net')) {
    //     bCdnHostname = hostname.Value;
    //   }
    // }

    // // If becdn.net domain is missing, add it
    // if (!hasBecdnDomain && bCdnHostname) {
    //   const newHostname = bCdnHostname.replace('b-cdn.net', 'becdn.net');
    //   await addHostnameToPullZone(libraryId, newHostname);
    // }
  }
}

// Run the process
processLibraries()
  .then(() => console.log('Processing completed'))
  .catch(error => console.error('Error processing libraries:', error));
