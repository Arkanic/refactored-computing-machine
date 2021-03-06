const fs = require("fs");

const weaponTypes = require("../src/shared/ctype/weapons");

let exportWeapons = {};

for(let i in weaponTypes) {
    exportWeapons[i] = weaponTypes[i].meta;
}
let exportWeaponsString = "module.exports=";
exportWeaponsString += JSON.stringify(exportWeapons);
exportWeaponsString = new Uint8Array(Buffer.from(exportWeaponsString));
fs.writeFile(__dirname + "/../public/meta/weapons.js", exportWeaponsString, (err) => {
    if(err) throw err;
    console.log("Generated weapons.");
});

const ammoTypes = require("../src/shared/ctype/ammunition");

let exportAmmunition = {};

for(let i in ammoTypes) {
    exportAmmunition[i] = ammoTypes[i];
}
let exportAmmunitionString = "module.exports=";
exportAmmunitionString += JSON.stringify(exportAmmunition);
exportAmmunitionString = new Uint8Array(Buffer.from(exportAmmunitionString));
fs.writeFile(__dirname + "/../public/meta/ammunition.js", exportAmmunitionString, (err) => {
    if(err) throw err;
    console.log("Generated ammunition.");
});

let exportFiles = [];
fs.readdir("./public/assets/images/", (err, files) => {
    if(err) throw err;
    files.forEach(file => {
        exportFiles.push(file);
    });
    let exportAssetNamesString = "module.exports=";
    exportAssetNamesString += JSON.stringify(exportFiles);
    exportAssetNamesString = new Uint8Array(Buffer.from(exportAssetNamesString));
    fs.writeFile(__dirname + "/../public/meta/assetnames.js", exportAssetNamesString, (err) => {
        if(err) throw err;
        console.log("Generated asset names");
    });
});