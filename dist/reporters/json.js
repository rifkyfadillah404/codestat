"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderJsonReport = renderJsonReport;
function renderJsonReport(data) {
    const output = {
        projectName: data.projectName,
        generatedAt: new Date().toISOString(),
        loc: data.loc,
        files: data.files,
    };
    return JSON.stringify(output, null, 2);
}
//# sourceMappingURL=json.js.map