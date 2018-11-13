# Project KAP

#### Chrome extension users: help page now available [`here`](https://lxieyang.github.io/project-KAP/unakite/)

## To build the app locally for development and debugging:

### Before you start:
1. Make sure you have [Git](https://git-scm.com/downloads) on your machine and your [ssh-keys are properly set up](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/) on your Github account.
2. Make sure you have the latest version of [`npm`](https://www.npmjs.com/) installed on your machine. To install, download and install the latest **LTS (stable)** version of [`Node.js`](https://nodejs.org/en/). Then run `npm install -g npm` from a command line window (If you are on a Mac, you might want to add `sudo` to the command to make sure you have proper permissions to install `npm` globally).


### To install:

1. Clone the repository by running `git clone git@github.com:lxieyang/project-KAP.git`.
2. Download `secrets.user.js` from the `#kap-dev` channel in the Kittur Lab Slack Team. Place the file under `/shared-components/src`. Make sure the name of the file is exactly `secrets.user.js`, as downloaded files from Slack may see changes of names sometimes.
3. Switch to the correct branch you are working on. For example, run `git checkout newchapter` to switch to the `newchapter` branch.
4. Under the directories `chrome-extension`, `shared-components`, and `table-showoff`, run commands
`rm -rf node_modules` followed by `rm package-lock.json` and `npm install`

### To load the Chrome Extension:

1. Change directory into `chrome-extension`, run `npm start`.
2. Load your extension on Chrome following:
    1. Access `chrome://extensions/`
    2. Check `Developer mode`
    3. Click on `Load unpacked extension`
    4. Select the `build` folder under `chrome-extension` directory.
3. Have fun.

### To load the VS Code Extension:

***...to be continued :-)***
