import { ciFailKeys, reportTypes } from "./bin/constants.js";

export default process.env == "CI"
  ? {
      failOn: ciFailKeys.MAJOR,
      ignorePackages: ["eslint", "prettier"],
      reportType: reportTypes.CI,
    }
  : {
      failOn: ciFailKeys.MAJOR,
      ignorePackages: ["eslint", "prettier"],
    };
