function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function _toISBN10(isbn13) {
  isbn13 += "";
  let digits = [];
  digits = isbn13.substr(3, 9).split("");
  let sum = 0;
  let chkTmp, chkDigit;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  chkTmp = 11 - (sum % 11);
  if (chkTmp == 10) {
    chkDigit = "x";
  } else if (chkTmp == 11) {
    chkDigit = 0;
  } else {
    chkDigit = chkTmp;
  }
  digits.push(chkDigit);
  return digits.join("");
}

// https://fight-tsk.blogspot.com/2014/09/isbnjavascript.html
function toISBN13(prefix, isbn10) {
  const modulas = 10;
  const weight = 3;
  let targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, "");
  targetCode = prefix + targetCode;
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < chars.length - 1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    }
  }
  checkSum = modulas - (checkSum % modulas);
  let isbn13 = "";
  for (let i = 0; i < chars.length - 1; i++) {
    isbn13 = isbn13 + chars[i];
  }
  isbn13 = isbn13 + checkSum;
  return isbn13;
}

function isValidISBN13(isbn13) {
  const modulas = 10;
  const weight = 3;
  const targetCode = isbn13.trim().toUpperCase().replace(/[^\d]/gi, "");
  if (targetCode.length != 13) {
    return false;
  }
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < chars.length - 1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    }
  }
  checkSum = modulas - (checkSum % modulas);
  return (checkSum == (parseInt(chars[chars.length - 1])));
}

function isValidISBN10(isbn10) {
  const modulas = 11;
  let weight = 10;
  const targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, "");
  if (targetCode.length != 10) {
    return false;
  }
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < (chars.length - 1); i++) {
    checkSum += weight * parseInt(chars[i]);
    weight--;
  }
  checkSum = modulas - (checkSum % modulas);

  let actualCheckSum = 10;
  if (chars[chars.length - 1] != "X") {
    actualCheckSum = parseInt(chars[chars.length - 1]);
  }
  return (checkSum == actualCheckSum);
}

function _isISBN13(code) {
  if (code.startsWith("978") || code.startsWith("979")) {
    return true;
  } else {
    return false;
  }
}

// https://qiita.com/mm_sys/items/9e95c48d4684957a3940
function isValidEAN(barcodeStr) { // 引数は文字列
  // 短縮用処理
  barcodeStr = ("00000" + barcodeStr).slice(-13);
  let evenNum = 0, oddNum = 0;
  for (let i = 0; i < barcodeStr.length - 1; i++) {
    if (i % 2 == 0) { // 「奇数」かどうか（0から始まるため、iの偶数と奇数が逆）
      oddNum += parseInt(barcodeStr[i]);
    } else {
      evenNum += parseInt(barcodeStr[i]);
    }
  }
  // 結果
  return 10 - parseInt((evenNum * 3 + oddNum).toString().slice(-1)) ===
    parseInt(barcodeStr.slice(-1));
}

function getInfoFromISBN(isbn, callback) {
  fetch(
    "https://app.rakuten.co.jp/services/api/Product/Search/20170426?format=json&affiliateId=1fce7ad4.9ceb2f6a.1fce7ad5.f0e8d979&applicationId=1017197774015471253&keyword=" +
      isbn,
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.hits > 0) {
        const product = data.Products[0].Product;
        const title = product.productName;
        const affiliateUrl = product.affiliateUrl;
        const info = document.createElement("a");
        info.href = affiliateUrl;
        info.textContent = title;
        if (callback) {
          callback(info);
        }
      }
    });
}

function _getInfoFromISBNByGoogle(isbn, callback) {
  fetch("https://www.googleapis.com/books/v1/volumes?q=" + isbn)
    .then((response) => response.json())
    .then((data) => {
      if (data.totalItems > 0) {
        const title = data.items[0].volumeInfo.title;
        const info = document.createTextNode(title);
        if (callback) {
          callback(info);
        }
      }
    });
}

function initScan() {
  const codeReader = new ZXing.BrowserMultiFormatReader();
  // const codeReader = new ZXing.BrowserBarcodeReader();
  const tbody = document.getElementById("memo");
  codeReader.getVideoInputDevices().then((videoInputDevices) => {
    const selectedDeviceId = videoInputDevices[0].deviceId;
    codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      "video",
      (result, _err) => {
        if (!waiting && result) {
          if (
            tbody.children.length == 0 ||
            tbody.children[1].children[0].textContent != result.text
          ) {
            setProductInfo(result, tbody);
          }
        }
      },
    );
  }).catch((err) => {
    console.error(err);
  });
}

function setProductInfo(result, tbody) {
  const scannedBox = document.createElement("scanned-box");
  const product = scannedBox.shadowRoot.querySelector(".product");
  scannedBox.shadowRoot.querySelector(".code").textContent = result.text;
  if (isValidISBN13(result.text)) {
    getInfoFromISBN(result.text, (productInfo) => {
      product.appendChild(productInfo);
    });
  } else if (isValidISBN10(result.text)) {
    ["978", "979"].some((prefix) => {
      const isbn13 = toISBN13(prefix, result.text);
      if (isValidISBN13(isbn13)) {
        getInfoFromISBN(result.text, (_title) => {
          product.appendChild(productInfo);
        });
        return true;
      }
    });
  } else if (isValidEAN(result.text)) {
    getInfoFromISBN(result.text, (productInfo) => {
      product.appendChild(productInfo);
    });
  }
  tbody.appendChild(scannedBox.shadowRoot);
  waiting = true;
  setTimeout(() => {
    waiting = false;
  }, 1000);
}

function toCSV() {
  let csv = "";
  const trs = [...document.getElementById("memo").getElementsByTagName("tr")];
  trs.forEach((tr) => {
    const target = [...tr.children].slice(0, 2);
    const line = target.map((td) => td.textContent).join(", ");
    csv += line + "\n";
  });
  copyToClipboard(csv);
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  alert("クリップボードにコピーしました。");
}

customElements.define(
  "scanned-box",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById("scanned-box").content.cloneNode(
        true,
      );
      template.querySelector("button").onclick = function () {
        this.parentNode.parentNode.remove();
      };
      this.attachShadow({ mode: "open" }).appendChild(template);
    }
  },
);

let waiting = false;
loadConfig();
initScan();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toCSV").onclick = toCSV;
