function generateNewFile() {
  str = document.getElementById("values").value;
  console.log(str);

  // document
  //   .getElementById("download_link")
  //   .setAttribute("hidden", "hidden");

  var csvIndex;
  var csvData;
  // for (let loop = 0; loop < originalFileContent.length; loop++) {
  //   newFileContent[loop] = originalFileContent[loop];
  // }
  newFileContent = originalFileContent.slice();
  newFileContent[0] = 1;

  const lines = str.split(/\r?\n/); // Split string into array of lines
  const hexPairRegex = /^[0-9a-fA-F]*(?:[,:;-])[0-9a-fA-F]{1,2}$/; // Regex for hex pairs separated by comma
  console.log("---");
  changes = 0;
  valuesStatus = "";
  var msg;
  for (let i = 0; i < lines.length; i++) {
    msg = "✅";
    valuesStatus = valuesStatus + (i + 1) + " ";
    const line = lines[i].replace(/\s/g, ""); // Remove all whitespace from line

    if (hexPairRegex.test(line)) {
      csvIndex = Number("0x" + line.split(/[,:;-]/)[0]) - offset;
      csvData = Number("0x" + line.split(/[,:;-]/)[1]);
      console.log(newFileContent.length);
      if (csvIndex >= 0 && csvIndex < newFileContent.length) {
        changes++;
        setByteAt(csvIndex + offset, csvData);
        console.log(
          `Line ${i + 1
          } contains a valid hex pair: ${csvIndex}*${csvData}`
        );
      } else {
        msg = "🚫R";
      }
    } else {
      msg = "🚫S";
      if (line == "") {
        msg = "";
      }
    }
    valuesStatus = valuesStatus + msg + "\r";
  }

  document.getElementById("valuesStatus").innerHTML = valuesStatus;

  md5Hash = md5(newFileContent.buffer);

  document.getElementById("md5Hash").innerHTML = md5Hash;

  if (changes > 0) {
    document.getElementById("download_link").removeAttribute("hidden");
    document.getElementById("md5HashView").removeAttribute("hidden");
  } else {
    document
      .getElementById("download_link")
      .setAttribute("hidden", "hidden");
    document
      .getElementById("md5HashView")
      .setAttribute("hidden", "hidden");
  }

  document.getElementById("changes").innerHTML = changes;
  hexview(newFileContent);

  // ---------------- DOWNLOAD LINK GENERATOR (BLOB)
  //data = new Blob([newFileContent], { type: "application/octet-stream" });
  data = new Blob([newFileContent.buffer], {
    type: "application/octet-stream",
  });
  url = window.URL.createObjectURL(data);
  document
    .getElementById("download_link")
    .setAttribute("download", originalFileName);
  document.getElementById("download_link").href = url;

  console.log(`Changes: ${changes}`);
}