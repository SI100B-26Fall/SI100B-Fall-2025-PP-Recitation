{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "aarch64-darwin"
        "x86_64-linux"
      ];
      perSystem =
        { pkgs, system, ... }:
        let
          courseName = "SI100B Fall 2026";
          repoPath = "SI100B-26Fall/SI100B-Fall-2026-PP-Recitation";
          nodeEnv = with pkgs; [
            git
            nodejs
            pnpm
          ];
          pnpmDepsHash = {
            aarch64-darwin = "sha256-CO2L8w3649XTaEvPgcZeNlUTPz7+on/wbx21xYd3zH4=";
            x86_64-linux = "sha256-JyCOtJ8/yXYPQN9lSii9EvpIvgN26s4Ibs/u5AwKZkc=";
          }.${system};
        in
        {
          formatter = pkgs.nixpkgs-fmt;
          devShells.default = pkgs.mkShellNoCC {
            packages = nodeEnv;
            shellHook = pkgs.lib.optionalString pkgs.stdenv.isDarwin ''
              unset DEVELOPER_DIR SDKROOT
            '';
          };
          packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
            name = "si100-static-page";
            pname = "si100-static-page";
            version = "0.2.0";
            src = ./.;

            nativeBuildInputs = [
              nodeEnv
              pkgs.pnpm.configHook
            ];

            pnpmDeps = pkgs.pnpm.fetchDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 1;
              hash = pnpmDepsHash;
            };

            buildPhase =
              ''
                runHook preBuild
                mkdir -p ./static

                touch index.md
                echo "---" >index.md
                echo "title: 欢迎来到 ${courseName}" >>index.md
                echo "theme: simple" >>index.md
                echo "highlightTheme: github" >>index.md
                echo "css: assets/custom.css" >>index.md
                echo "---" >>index.md
                echo "## ${courseName} Slides Collection" >>index.md
                echo >>index.md
                
                echo "<div style=\"column-count:2; column-gap:0px; padding: 1vh; word-break: break-word\">" >>index.md
                echo >>index.md

                count=0
                find slides/ -name '*.md' \
                  ! -path 'slides/Example/*.md' \
                  ! -exec grep -q 'marp: true' {} \; \
                  -print | sort | while read -r file; do
                  
                  filename=$(basename "$file" .md)
                  output_dir="static/$filename"
                  echo "Processing $output_dir"

                  if [ $count -eq 12 ]; then
                      echo "</hr>" >>index.md
                  fi
                  
                  echo "- [$filename](./$filename)" >>index.md

                  pnpm exec reveal-md $file --static $output_dir --template ./assets/reveal.html --preprocessor ./assets/preproc.js --scripts assets/menu/menu.js,assets/inject.js
                  mkdir -p $output_dir/_assets/assets/menu
                  cp assets/menu/menu.css $output_dir/_assets/assets/menu/menu.css
                  file_dir=$(dirname $file)
                  if [ -d "$file_dir/images" ]; then
                    cp -r $file_dir/images $output_dir
                  fi

                  count=$((count + 1))
                done

                echo "</div>" >>index.md
                echo >>index.md
                
                echo >>index.md
                echo "---" >>index.md
                echo "## ${courseName} Notebooks Collection" >>index.md

                find . -name "*.ipynb" | sort | while read -r file; do
                  echo "Processing $file"
                  pure_path="$(printf '%s' "$file" | sed 's#^\./#/#')"
                  echo "- [$(basename "$file" .md)](https://nbviewer.org/github/${repoPath}/tree/main$pure_path)" >>index.md
                done

                pnpm exec reveal-md index.md --static static
                rm index.md

                runHook postBuild
              '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r static/* $out
              runHook postInstall
            '';
          });
        };
    };
}
