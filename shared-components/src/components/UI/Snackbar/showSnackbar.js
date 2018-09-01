const showSnackbar = (id) => {
  // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_snackbar
  let x = document.getElementById(id);
  let xLeft = Math.floor((window.innerWidth - x.clientWidth)/2);
  x.style.left = xLeft + 'px';
  x.classList.add("show");
  setTimeout(function () { 
    x.classList.remove("show"); 
  }, 3000);
}

export default showSnackbar;