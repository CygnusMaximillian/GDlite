export function IsAuthenticated(){
  return !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
  window.local.href = "/login";
}