{pkgs}: {
  deps = [
    pkgs.wget
    pkgs.rustc
    pkgs.pkg-config
    pkgs.openssl
    pkgs.libxcrypt
    pkgs.libiconv
    pkgs.cargo
  ];
}
