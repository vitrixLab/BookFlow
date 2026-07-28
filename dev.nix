{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_20
    pkgs.corepack          # pnpm
    pkgs.openssl           # Prisma
    pkgs.podman            # container runtime
    pkgs.podman-compose    # compose support
  ];
}
