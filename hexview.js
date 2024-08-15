// hexview.js

// bytes:  is an array of any numbers of members
//         wich are integer numbers from 0 to 255 (00-ff) 
// offset: is a decimal number of the starting offset address
//         of the code (eg. 0x1000 if hex)
// format: is a string with value "text" or "html". all aothers will return ""

function hexview(bytes = [], offset = 0x0, format = "text", marks = []) {

  let marks2 = [];

  for (let index = 0; index < marks.length; index++) {
    marks2[marks[index]] = true;
  }

  //console.log(marks2[0]);
  //console.log(marks2[1]);
  //console.log(marks2[2]);


  function convertTo2DArray(numbers = []) {
    const hexArray = numbers.map(number => number.toString(16).padStart(2, '0'));
    while (hexArray.length % 16 !== 0) {
      hexArray.push("  ");
    }
    return Array.from({ length: hexArray.length / 16 }, (_, i) => hexArray.slice(i * 16, i * 16 + 16));
  }

  let space;
  let cr;
  let colorStart;
  let colorEnd;
  let printableArray;

  switch (format.toLowerCase()) {
    case "html":
      space = "&nbsp;";
      cr = "<br>\n";
      colorStart = '<span style="background-color: burlywood;">';
      colorEnd = '</span>';
      printableArray = Array.from({ length: 256 }, (_, i) => {
        const char = String.fromCharCode(i);
        const entity = i >= 32 && i <= 126 || i >= 160 && i <= 255 ? char : '.';
        return entity.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(String.fromCharCode(173), '.')
          .replace(/\s/g, '&nbsp;');
      });
      break;

    case "text":
      space = " ";
      cr = "\n";
      colorStart = '';
      colorEnd = '';
      printableArray = Array.from({ length: 256 }, (_, i) => {
        const char = i === 173 ? '.' : String.fromCharCode(i);
        return i >= 32 && i <= 126 || i >= 160 && i <= 255 ? char : '.';
      });
      break;

    default:
      return "";
      break;
  }

  // --------------------------------------------------------------------------------

  let maxAddressDigits = (offset + (bytes.length)).toString(16);
  let shift = Number("0x" + offset.toString(16).charAt(offset.toString(16).length - 1));
  maxAddressDigits = maxAddressDigits.length;
  let hexChain = ['0' + space, '1' + space, '2' + space, '3' + space, '4' + space, '5' + space, '6' + space, '7' + space, '8' + space, '9' + space, 'a' + space, 'b' + space, 'c' + space, 'd' + space, 'e' + space, 'f' + space];
  hexChain = hexChain.slice(shift, 16).concat(hexChain.slice(0, shift));
  hexChain = hexChain[0] + hexChain[1] + hexChain[2] + hexChain[3] + space + hexChain[4] + hexChain[5] + hexChain[6] + hexChain[7] + space + hexChain[8] + hexChain[9] + hexChain[10] + hexChain[11] + space + hexChain[12] + hexChain[13] + hexChain[14] + hexChain[15];
  let hexChainShort = hexChain.replace(/\s/g, '').replace(/&nbsp;/g, '');
  bytes = convertTo2DArray(bytes, space);

  // -------------------- hexDump Header -------------------
  let hexDump = "";
  hexDump += space.repeat(maxAddressDigits + 3);
  hexDump += hexChain + space.repeat(19) + cr;
  hexDump += space.repeat(maxAddressDigits + 3) + "--------" + space + "--------" + space + "--------" + space + "--------" + space + space + space;
  hexDump += hexChainShort + cr;

  // -------------------- hexDump lines -------------------
  let cursor = 0;
  for (let row = 0; row < bytes.length; row++) {

    // prepare the printable characters of the line
    let printableData = "";
    let hexData = "";
    for (let column = 0; column < 16; column++) {
      if (bytes[row][column] == "  ") {
        hexData += space + space; // puede ser que vaya en la estructura igual a esta que quiero hacer
        printableData += space;
      } else {
        //console.log(marks2[cursor]);
        if (format.toLowerCase() == "html" && marks2[cursor]) {
          printableData += colorStart + printableArray[Number("0x" + bytes[row][column])] + colorEnd;
          hexData += colorStart + bytes[row][column] + colorEnd;
        } else {
          printableData += printableArray[Number("0x" + bytes[row][column])];
          hexData += bytes[row][column];
        }
        if (column == 3 || column == 7 || column == 11) hexData += space;
      }
      cursor++;
    }

    hexDump += offset.toString(16).padStart(maxAddressDigits, "0") + space + "|" + space;
    hexDump += hexData + space + "|" + space;
    hexDump += printableData + cr;
    offset += 16;
  }
  return hexDump;
}

//let bytes = Array.from({ length: 255 }, (_, i) => i);
//bytes.push(65);
//bytes = [65, 66, 67];

//document.querySelector('#file-content1').innerHTML = hexview(bytes, 0x0, "text");
//document.querySelector('#file-content2').innerHTML = hexview(bytes, 0x0, "html", [0, 1, 30, 65, 71, 255]);