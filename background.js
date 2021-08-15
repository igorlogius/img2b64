
const temporary = browser.runtime.id.endsWith('@temporary-addon'); // debugging?
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

function onError(e, msg){
	console.log(`${extname}::onError error: ${e}, message: ${msg}`);
}

async function showNotification(title,message){
	const options = {
		"type": "basic",
		"iconUrl": browser.runtime.getURL("icon.png"),
		"title": extname + ": " + title,
		"message": message
	};
	try {
		const nid = await browser.notifications.create(extname, options); // notifications permission 

		return nid;
	}catch(err){
		onError(err, 'failed notificationId.create');
	}
	return null;
}

function pFileReader(file) {
	return new Promise( (resolve,reject) => {
		const fr = new FileReader();
		fr.onload = () => { resolve(fr.result); }
		fr.onerror = reject;
		fr.readAsDataURL(file);
	});
}


async function onClicked(clickData,tab) {
	if(clickData.menuItemId !== extname){
		return;
	}

	let title = " - Failure";
	let msg = "The image data was successfully copied into the clipboard buffer";

	try {
		let data = await fetch(clickData.srcUrl, { // <all_urls> permissions 
			method: "GET", 
			mode: "cors", 
			credentials: "include", 
			cache: "default", 
			redirect: "follow" 
		}); 
		data = await data.blob();

		try {
			data = await pFileReader(data);
			console.log(data);

			try {
				navigator.clipboard.writeText(data);
				title = " - Success";
			}catch(e) {
				msg = 'The image data could not be copied into the clipboard buffer';
			}
		}catch(e){
			msg = 'The image data could not be read into memory';
		}
	}catch(e){
		msg = 'The image data could not be retrieved from cache or network';
	}
	showNotification(title, msg);
}

browser.menus.create({   // menus permission 
	id: extname,
	title: extname,
	documentUrlPatterns: ["<all_urls>"],
	contexts: ["image"]
});

browser.menus.onClicked.addListener(onClicked); // menus permission 

