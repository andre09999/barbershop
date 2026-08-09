let appPromise;

module.exports = async function handler(request, response) {
  appPromise ||= import("../server/src/app.js").then(({ app }) => app);
  const app = await appPromise;
  return app(request, response);
};
