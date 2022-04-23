import axios from "axios";
import semverGte from "semver/functions/gte.js";
import diff from "semver/functions/diff.js";

const NPM_REGISTRY_URL = "https://registry.npmjs.org";
const NPM_PACKAGE_URL = "https://www.npmjs.com/package";
const whitelistedDependencies = process.env.DEP_CHECK_WHITELIST || [];

const filterDependencies = (whiteList, dep) => {
  return dep.filter((d) => {
    return !whiteList.includes(d.package);
  });
};

export const checkDependencies = async ({
  peerDependencies = [],
  devDependencies = [],
  dependencies = [],
}) => {
  const whiteList =
    whitelistedDependencies.length > 0
      ? whitelistedDependencies.split(",")
      : [];

  const peerDependenciesResult = await processDependencies(
    peerDependencies,
    whiteList
  );
  const devDependenciesResult = await processDependencies(
    devDependencies,
    whiteList
  );
  const dependenciesResult = await processDependencies(dependencies, whiteList);

  return {
    peerDependenciesResult,
    devDependenciesResult,
    dependenciesResult,
  };
};

const processDependencies = async (dep, whiteList) => {
  try {
    const filteredDeps = filterDependencies(whiteList, dep);
    const processedData = await Promise.all(
      filteredDeps.map(async (current) => {
        const data = await checkDependencyInNPMRegistry({
          package: current.package,
        });
        const report = await generateReport(data, current);
        return report;
      })
    );
    return processedData.filter((f) => !f.package.error);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

const checkDependencyInNPMRegistry = async ({ package: jsPackage }) => {
  try {
    const { data } = await axios.get(`${NPM_REGISTRY_URL}/${jsPackage}`);
    const { time } = data;
    const tags = data["dist-tags"];
    return { versionTimeline: time, tags };
  } catch (e) {
    console.error(
      `There was an issue searching the registry for ${jsPackage}, skipping...`
    );
    return { versionTimeline: {}, tags: {}, error: true };
  }
};

const generateVersionObject = ({
  name,
  versionTimeline,
  latest,
  definedVersion,
  error = false,
}) => {
  if (error) return { package: { error } };

  return {
    package: {
      name,
      registry_url: `${NPM_REGISTRY_URL}/${name}`,
      npm_url: `${NPM_PACKAGE_URL}/${name}`,
      latest: {
        version: latest || definedVersion,
        releaseDate: versionTimeline[latest] || versionTimeline[definedVersion],
      },
      current: {
        version: definedVersion,
        releaseDate: versionTimeline[definedVersion],
      },
      upgradeType: diff(definedVersion, latest || definedVersion) || "N/A",
      error,
    },
  };
};

const generateReport = async (
  { versionTimeline, tags, error = false },
  currentPackage
) => {
  return new Promise((resolve, reject) => {
    try {
      if (error) {
        return resolve(
          generateVersionObject({
            error
          })
        );
      }

      const getDefinedVersion = () => {
        if (Number.isNaN(Number.parseFloat(currentPackage.version))) {
          const v = currentPackage.version.split("");
          const [throwAway, ...rest] = v;
          return rest.join("");
        } else {
          return currentPackage.version;
        }
      };

      const definedVersion = getDefinedVersion();

      const { latest } = tags;
      let versionInfo = {};

      if (!semverGte(definedVersion, latest)) {
        versionInfo = generateVersionObject({
          name: currentPackage.package,
          versionTimeline,
          latest,
          definedVersion,
        });
      } else {
        versionInfo = generateVersionObject({
          name: currentPackage.package,
          versionTimeline,
          definedVersion,
        });
      }
      resolve(versionInfo);
    } catch (e) {
      console.warn(e);
      reject(e);
    }
  });
};
