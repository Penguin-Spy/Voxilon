{ pkgs }: {
	deps = with pkgs; [
		nodejs-16_x
		nodePackages.typescript-language-server
		#pkgs.yarn
		#pkgs.replitPackages.jest
	];
}