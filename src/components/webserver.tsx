export async function AttemptServerConnection(webserver_url: string) {
  let newUrl = "";
  let connected = true;
  let ip = "";
  let error = null;

  try {;
    let reponse = await fetch(webserver_url);
    if (!reponse.ok) {
      throw new Error("Response was not ok to URL: " + webserver_url + " (Response Status: " + reponse.status + ")");
    }
    let data = await reponse.json();
    if (data.status !== "ok") {
      throw new Error("Failed to get data from server: " + data.traceback);
    }

    connected = true;
    newUrl = data.url;
    ip = data.ip;

  } catch (error : any) {
    connected = false;
    newUrl = webserver_url;
    ip = "localhost";
    error = error.message;
  }

  return { connected, newUrl, ip, error };
}

export async function GetLanguageData(data_url: string) {
  let response = await fetch(data_url);
  if (!response.ok) {
    throw new Error("Response was not ok to URL: " + data_url + " (Response Status: " + response.status + ")");
    return null;
  }
  let data = await response.json();
  if (data.status !== "ok") {
    throw new Error("Request returned a status of error: " + data.traceback);
    return null;
  }

  return data.data;
}

export async function CreateNewLanguage(data_url: string, language_data: {name: string, en_name: string, iso_code: string}) {
  let response = await fetch(data_url, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: language_data.name,
      name_en: language_data.en_name,
      iso_code: language_data.iso_code
    })
  });
  if (!response.ok) {
    console.error("Response was not ok to URL: " + data_url + " (Response Status: " + response.status + ")");
    return false;
  }

  let data = await response.json();
  if (data.status !== "ok") {
    console.error("Request returned a status of error: " + data.traceback);
    return false;
  }

  return true;
}

export async function GetTranslationData(data_url: string, language: string) {
  let translation_data = null;
  try {
    let reponse = await fetch(data_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: language
      })
    });
    if (!reponse.ok) {
      throw new Error("Response was not ok to URL: " + data_url + " (Response Status: " + reponse.status + ")");
      return null;
    }
    translation_data = await reponse.json();
  } catch (error : any) {
    throw new Error("Failed to get data from server: " + error.message);
    return null;
  }

  if (translation_data.status !== "ok") {
    throw new Error("Request returned a status of error: " + translation_data.traceback);
    return null;
  }

  translation_data = translation_data.data;
  return translation_data;
}

export async function SaveTranslationData(data_url: string, language_data: {name: string, en_name: string, iso_code: string}, keys : string[], values : string[]) {
  let response = await fetch(data_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      language_data: {
        name: language_data.name,
        name_en: language_data.en_name,
        iso_code: language_data.iso_code
      },
      key_data: keys,
      translation_data: values
    })
  })

  if (!response.ok) {
    throw new Error("Response was not ok to URL: " + data_url + " (Response Status: " + response.status + ")");
  }

  let data = await response.json();
  if (data.status !== "ok") {
    throw new Error("Failed to get data from server: " + data.traceback);
  }
}

export async function UpdateTranslationData(webserver_url : string) {
  let reponse = await fetch(webserver_url, {
    method: 'GET'
  });

  if (!reponse.ok) {
    throw new Error("Response was not ok to URL: " + webserver_url + " (Response Status: " + reponse.status + ")");
    return false;
  }
  return true;
}

export async function WindowAction(webserver_url : string, action : string) {
  let url = webserver_url + "/window/" + action;
  await fetch(url, {
    method: 'POST'
  });
}