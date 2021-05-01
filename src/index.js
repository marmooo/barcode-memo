function loadConfig() {
  if (localStorage.getItem('darkMode') == 1) {
    document.documentElement.dataset.theme = 'dark';
  }
}
loadConfig();

function toggleDarkMode() {
  if (localStorage.getItem('darkMode') == 1) {
    localStorage.setItem('darkMode', 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem('darkMode', 1);
    document.documentElement.dataset.theme = 'dark';
  }
}

customElements.define('scanned-box', class extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('scanned-box').content.cloneNode(true);
    template.querySelector('.cursor').onclick = function() {
      this.parentNode.remove();
    };
    this.attachShadow({ mode:'open' }).appendChild(template);
  }
});

function toISBN10(isbn13) {
  isbn13 += "";
  var digits = [];
  digits = isbn13.substr(3,9).split("") ;
  var sum = 0; var chk_tmp, chk_digit;
  for(var i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  chk_tmp = 11 - (sum % 11);
  if (chk_tmp == 10) {
    chk_digit = 'x';
  } else if (chk_tmp == 11) {
    chk_digit = 0;
  } else {
    chk_digit = chk_tmp;
  }
  digits.push(chk_digit);
  return digits.join("");
}

// https://fight-tsk.blogspot.com/2014/09/isbnjavascript.html
function toISBN13(prefix, isbn10) {
  var modulas = 10;
  var weight = 3;
  var targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, '');
  targetCode = prefix + targetCode;
  var checkSum = 0;
  var chars = targetCode.split('');
  for (var i = 0; i < chars.length-1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    };
  };
  checkSum = modulas - (checkSum % modulas);
  var isbn13 = "";
  for (var i = 0; i < chars.length-1; i++) {
    isbn13 = isbn13 + chars[i];
  };
  isbn13 = isbn13 + checkSum;
  return isbn13;
};

function isValidISBN13(isbn13){
  var modulas = 10;
  var weight = 3;
  var targetCode = isbn13.trim().toUpperCase().replace(/[^\d]/gi, '');
  if (targetCode.length!=13) {
    return false;
  };
  var checkSum = 0;
  var chars = targetCode.split('');
  for (var i = 0; i < chars.length-1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    };
  };
  checkSum = modulas - (checkSum % modulas);
  return (checkSum == (parseInt(chars[chars.length-1])));
}

function isValidISBN10(isbn10){
  var modulas = 11;
  var weight = 10;
  var targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, '');
  if (targetCode.length!=10) {
    return false;
  };
  var checkSum = 0;
  var chars = targetCode.split('');
  for (var i = 0; i < (chars.length-1); i++) {
    checkSum += ( weight * parseInt(chars[i]) );
    weight--;
  };
  checkSum = modulas - (checkSum % modulas);

  var actualCheckSum = 10;
  if (chars[chars.length-1] != "X"){
    actualCheckSum = parseInt(chars[chars.length-1]);
  }
  return (checkSum == actualCheckSum);
}

function isISBN13(code) {
  if (code.startsWith('978') || code.startsWith('979')) {
    return true;
  } else {
    return false;
  }
}

// https://qiita.com/mm_sys/items/9e95c48d4684957a3940
function isValidEAN(barcodeStr) { // 引数は文字列
  // 短縮用処理
  barcodeStr = ('00000' + barcodeStr).slice(-13);
  let evenNum = 0, oddNum = 0;
  for (var i = 0; i < barcodeStr.length - 1; i++) {
    if (i % 2 == 0) { // 「奇数」かどうか（0から始まるため、iの偶数と奇数が逆）
      oddNum += parseInt(barcodeStr[i]);
    } else {
      evenNum += parseInt(barcodeStr[i]);
    }
  }
  // 結果
  return 10 - parseInt((evenNum * 3 + oddNum).toString().slice(-1)) === parseInt(barcodeStr.slice(-1));
}

function getInfoFromISBN(isbn, callback) {
  fetch('https://app.rakuten.co.jp/services/api/Product/Search/20170426?format=json&affiliateId=1fce7ad4.9ceb2f6a.1fce7ad5.f0e8d979&applicationId=1017197774015471253&keyword=' + isbn)
    .then(response => response.json())
    .then(data => {
      if (data.hits > 0) {
        const product = data.Products[0].Product;
        const title = product.productName;
        const affiliateUrl = product.affiliateUrl;
        const info = document.createElement('a');
        info.href = affiliateUrl;
        info.textContent = title;
        if (callback) {
          callback(info);
        }
      }
    });
}

function getInfoFromISBNByGoogle(isbn, callback) {
  fetch('https://www.googleapis.com/books/v1/volumes?q=' + isbn)
    .then(response => response.json())
    .then(data => {
      if (data.totalItems > 0) {
        const title = data.items[0].volumeInfo.title;
        const info = document.createTextNode(title);
        if (callback) {
          callback(info);
        }
      }
    });
}

let waiting = false;
const codeReader = new ZXing.BrowserMultiFormatReader();
// const codeReader = new ZXing.BrowserBarcodeReader();
const tbody = document.getElementById('memo').querySelector('tr').parentNode;
codeReader.getVideoInputDevices().then(videoInputDevices => {
  const selectedDeviceId = videoInputDevices[0].deviceId;
  codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
    if (!waiting && result) {
      const trs = tbody.children;
      if (trs[trs.length - 1].children[0].textContent != result.text) {
        const scannedBox = document.createElement('scanned-box');
        const product = scannedBox.shadowRoot.querySelector('.product');
        scannedBox.shadowRoot.querySelector('.code').textContent = result.text;
        if (isValidISBN13(result.text)) {
          getInfoFromISBN(result.text, productInfo => {
            product.appendChild(productInfo);
          });
        } else if (isValidISBN10(result.text)) {
          ['978', '979'].some(prefix => {
            const isbn13 = toISBN13(prefix, result.text);
            if (isValidISBN13(isbn13)) {
              getInfoFromISBN(result.text, title => {
                product.appendChild(productInfo);
              });
              return true;
            }
          });
        } else if (isValidEAN(result.text)) {
          getInfoFromISBN(result.text, productInfo => {
            product.appendChild(productInfo);
          });
        }
        tbody.insertBefore(scannedBox.shadowRoot, tbody.children[1]);
        waiting = true;
        setTimeout(() => {
          waiting = false;
        }, 1000);
      }
    }
  });
}).catch((err) => {
  console.error(err)
});

function toCSV() {
  let csv = '';
  const trs = [...document.getElementById('memo').querySelector('tr').parentNode.children];
  trs.forEach(tr => {
    const line = [...tr.children].slice(0, 2).map(td => td.textContent).join(', ');
    csv += line + '\n';
  });
  copyToClipboard(csv);
}

function iosCopyToClipboard(el) {

    // resolve the element
    el = (typeof el === 'string') ? document.querySelector(el) : el;

    // handle iOS as a special case
    if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {

        // save current contentEditable/readOnly status
        var editable = el.contentEditable;
        var readOnly = el.readOnly;

        // convert to editable with readonly to stop iOS keyboard opening
        el.contentEditable = true;
        el.readOnly = true;

        // create a selectable range
        var range = document.createRange();
        range.selectNodeContents(el);

        // select the range
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        el.setSelectionRange(0, 999999);

        // restore contentEditable/readOnly to original state
        el.contentEditable = editable;
        el.readOnly = readOnly;
    }
    else {
        el.select();
    }

    // execute copy command
    document.execCommand('copy');
}

function copyToClipboard(text) {
  var input = document.createElement('textarea');
  document.body.appendChild(input);
  input.value = text;
  iosCopyToClipboard(input);
  document.body.removeChild(input);
  alert('クリップボードにコピーしました。');
}
