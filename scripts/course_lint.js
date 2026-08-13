const path = require("path");
const { validateCourseBindings } = require("./course_bindings_validation");

const root = path.resolve(__dirname, "..");
const errors = [];
validateCourseBindings({ root, fail: (file, message) => errors.push(`${file}: ${message}`) });

if (errors.length) {
  errors.forEach((message) => console.error(`fail ${message}`));
  console.error(`\n${errors.length} course binding error(s) found.`);
  process.exit(1);
}

console.log("ok checked course target bindings");
