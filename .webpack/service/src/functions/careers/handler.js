/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/functions/careers/handler.ts":
/*!******************************************!*\
  !*** ./src/functions/careers/handler.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.main = void 0;\nconst lambda_1 = __webpack_require__(/*! @libs/lambda */ \"./src/libs/lambda.ts\");\nconst apply_service_1 = __webpack_require__(/*! src/service/apply.service */ \"./src/service/apply.service.ts\");\nconst careers = async (event) => {\n    switch (event.httpMethod) {\n        case 'POST':\n            return {\n                statusCode: 200,\n                body: await apply_service_1.apply(event),\n            };\n    }\n};\nexports.main = lambda_1.middyfy(careers);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvZnVuY3Rpb25zL2NhcmVlcnMvaGFuZGxlci50cy5qcyIsIm1hcHBpbmdzIjoiOzs7QUFDQTtBQUNBO0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zbW9vdGhzdGFjay1jYXJlZXJzLWFwaS8uL3NyYy9mdW5jdGlvbnMvY2FyZWVycy9oYW5kbGVyLnRzPzg5NGUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBWYWxpZGF0ZWRFdmVudEFQSUdhdGV3YXlQcm94eUV2ZW50IH0gZnJvbSAnQGxpYnMvYXBpR2F0ZXdheSc7XG5pbXBvcnQgeyBtaWRkeWZ5IH0gZnJvbSAnQGxpYnMvbGFtYmRhJztcbmltcG9ydCB7IGFwcGx5IH0gZnJvbSAnc3JjL3NlcnZpY2UvYXBwbHkuc2VydmljZSc7XG5cbmltcG9ydCBzY2hlbWEgZnJvbSAnLi9zY2hlbWEnO1xuXG5jb25zdCBjYXJlZXJzOiBWYWxpZGF0ZWRFdmVudEFQSUdhdGV3YXlQcm94eUV2ZW50PHR5cGVvZiBzY2hlbWE+ID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gIHN3aXRjaCAoZXZlbnQuaHR0cE1ldGhvZCkge1xuICAgIGNhc2UgJ1BPU1QnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBib2R5OiBhd2FpdCBhcHBseShldmVudCBhcyBhbnkpLFxuICAgICAgfTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IG1haW4gPSBtaWRkeWZ5KGNhcmVlcnMpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/functions/careers/handler.ts\n");

/***/ }),

/***/ "./src/libs/apiGateway.ts":
/*!********************************!*\
  !*** ./src/libs/apiGateway.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.formatJSONResponse = void 0;\nconst formatJSONResponse = (response) => {\n    return {\n        statusCode: 200,\n        body: JSON.stringify(response)\n    };\n};\nexports.formatJSONResponse = formatJSONResponse;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGlicy9hcGlHYXRld2F5LnRzLmpzIiwibWFwcGluZ3MiOiI7OztBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUxBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc21vb3Roc3RhY2stY2FyZWVycy1hcGkvLi9zcmMvbGlicy9hcGlHYXRld2F5LnRzPzYyNTEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0LCBIYW5kbGVyIH0gZnJvbSBcImF3cy1sYW1iZGFcIlxuaW1wb3J0IHR5cGUgeyBGcm9tU2NoZW1hIH0gZnJvbSBcImpzb24tc2NoZW1hLXRvLXRzXCI7XG5cbnR5cGUgVmFsaWRhdGVkQVBJR2F0ZXdheVByb3h5RXZlbnQ8Uz4gPSBPbWl0PEFQSUdhdGV3YXlQcm94eUV2ZW50LCAnYm9keSc+ICYgeyBib2R5OiBGcm9tU2NoZW1hPFM+IH1cbmV4cG9ydCB0eXBlIFZhbGlkYXRlZEV2ZW50QVBJR2F0ZXdheVByb3h5RXZlbnQ8Uz4gPSBIYW5kbGVyPFZhbGlkYXRlZEFQSUdhdGV3YXlQcm94eUV2ZW50PFM+LCBBUElHYXRld2F5UHJveHlSZXN1bHQ+XG5cbmV4cG9ydCBjb25zdCBmb3JtYXRKU09OUmVzcG9uc2UgPSAocmVzcG9uc2U6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB7XG4gIHJldHVybiB7XG4gICAgc3RhdHVzQ29kZTogMjAwLFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/libs/apiGateway.ts\n");

/***/ }),

/***/ "./src/libs/lambda.ts":
/*!****************************!*\
  !*** ./src/libs/lambda.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.middyfy = void 0;\nconst core_1 = __importDefault(__webpack_require__(/*! @middy/core */ \"@middy/core\"));\nconst http_json_body_parser_1 = __importDefault(__webpack_require__(/*! @middy/http-json-body-parser */ \"@middy/http-json-body-parser\"));\nconst http_cors_1 = __importDefault(__webpack_require__(/*! @middy/http-cors */ \"@middy/http-cors\"));\nconst middleware_1 = __webpack_require__(/*! ./middleware */ \"./src/libs/middleware.ts\");\nconst middyfy = (handler) => {\n    return core_1.default(handler).use(http_json_body_parser_1.default()).use(http_cors_1.default()).use(middleware_1.apiGatewayResponseMiddleware());\n};\nexports.middyfy = middyfy;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGlicy9sYW1iZGEudHMuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFGQSIsInNvdXJjZXMiOlsid2VicGFjazovL3Ntb290aHN0YWNrLWNhcmVlcnMtYXBpLy4vc3JjL2xpYnMvbGFtYmRhLnRzPzZiMjUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1pZGR5IGZyb20gJ0BtaWRkeS9jb3JlJztcbmltcG9ydCBtaWRkeUpzb25Cb2R5UGFyc2VyIGZyb20gJ0BtaWRkeS9odHRwLWpzb24tYm9keS1wYXJzZXInO1xuaW1wb3J0IGNvcnMgZnJvbSAnQG1pZGR5L2h0dHAtY29ycyc7XG5pbXBvcnQgeyBhcGlHYXRld2F5UmVzcG9uc2VNaWRkbGV3YXJlIH0gZnJvbSAnLi9taWRkbGV3YXJlJztcblxuZXhwb3J0IGNvbnN0IG1pZGR5ZnkgPSAoaGFuZGxlcikgPT4ge1xuICByZXR1cm4gbWlkZHkoaGFuZGxlcikudXNlKG1pZGR5SnNvbkJvZHlQYXJzZXIoKSkudXNlKGNvcnMoKSkudXNlKGFwaUdhdGV3YXlSZXNwb25zZU1pZGRsZXdhcmUoKSk7XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/libs/lambda.ts\n");

/***/ }),

/***/ "./src/libs/middleware.ts":
/*!********************************!*\
  !*** ./src/libs/middleware.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.apiGatewayResponseMiddleware = void 0;\nconst http_errors_1 = __importDefault(__webpack_require__(/*! http-errors */ \"http-errors\"));\nconst apiGateway_1 = __webpack_require__(/*! ./apiGateway */ \"./src/libs/apiGateway.ts\");\nconst apiGatewayResponseMiddleware = (options = {}) => {\n    const after = async (request) => {\n        if (!request.event?.httpMethod || request.response === undefined || request.response === null) {\n            return;\n        }\n        const existingKeys = Object.keys(request.response);\n        const isHttpResponse = existingKeys.includes('statusCode') && existingKeys.includes('headers') && existingKeys.includes('body');\n        if (isHttpResponse) {\n            return;\n        }\n        request.response = apiGateway_1.formatJSONResponse(request.response);\n    };\n    const onError = async (request) => {\n        const { error } = request;\n        let statusCode = 500;\n        if (error instanceof http_errors_1.default.HttpError) {\n            statusCode = error.statusCode;\n        }\n        if (options.enableErrorLogger) {\n            console.error(error);\n        }\n        request.response = { ...request.response, body: JSON.stringify({ message: error.message }), statusCode };\n    };\n    return {\n        after,\n        onError,\n    };\n};\nexports.apiGatewayResponseMiddleware = apiGatewayResponseMiddleware;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvbGlicy9taWRkbGV3YXJlLnRzLmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUVBO0FBQ0E7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWpDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3Ntb290aHN0YWNrLWNhcmVlcnMtYXBpLy4vc3JjL2xpYnMvbWlkZGxld2FyZS50cz9iMWY2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtaWRkeSBmcm9tICdAbWlkZHkvY29yZSc7XG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgY3JlYXRlSHR0cEVycm9yIGZyb20gJ2h0dHAtZXJyb3JzJztcbmltcG9ydCB7IGZvcm1hdEpTT05SZXNwb25zZSB9IGZyb20gJy4vYXBpR2F0ZXdheSc7XG5pbXBvcnQgTWlkZGxld2FyZUZ1bmN0aW9uID0gbWlkZHkuTWlkZGxld2FyZUZ1bmN0aW9uO1xuXG5leHBvcnQgY29uc3QgYXBpR2F0ZXdheVJlc3BvbnNlTWlkZGxld2FyZSA9IChvcHRpb25zOiB7IGVuYWJsZUVycm9yTG9nZ2VyPzogYm9vbGVhbiB9ID0ge30pID0+IHtcbiAgY29uc3QgYWZ0ZXI6IE1pZGRsZXdhcmVGdW5jdGlvbjxBUElHYXRld2F5UHJveHlFdmVudCwgYW55PiA9IGFzeW5jIChyZXF1ZXN0KSA9PiB7XG4gICAgaWYgKCFyZXF1ZXN0LmV2ZW50Py5odHRwTWV0aG9kIHx8IHJlcXVlc3QucmVzcG9uc2UgPT09IHVuZGVmaW5lZCB8fCByZXF1ZXN0LnJlc3BvbnNlID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGV4aXN0aW5nS2V5cyA9IE9iamVjdC5rZXlzKHJlcXVlc3QucmVzcG9uc2UpO1xuICAgIGNvbnN0IGlzSHR0cFJlc3BvbnNlID1cbiAgICAgIGV4aXN0aW5nS2V5cy5pbmNsdWRlcygnc3RhdHVzQ29kZScpICYmIGV4aXN0aW5nS2V5cy5pbmNsdWRlcygnaGVhZGVycycpICYmIGV4aXN0aW5nS2V5cy5pbmNsdWRlcygnYm9keScpO1xuXG4gICAgaWYgKGlzSHR0cFJlc3BvbnNlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlcXVlc3QucmVzcG9uc2UgPSBmb3JtYXRKU09OUmVzcG9uc2UocmVxdWVzdC5yZXNwb25zZSk7XG4gIH07XG5cbiAgY29uc3Qgb25FcnJvcjogTWlkZGxld2FyZUZ1bmN0aW9uPEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0gYXN5bmMgKHJlcXVlc3QpID0+IHtcbiAgICBjb25zdCB7IGVycm9yIH0gPSByZXF1ZXN0O1xuICAgIGxldCBzdGF0dXNDb2RlID0gNTAwO1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIGNyZWF0ZUh0dHBFcnJvci5IdHRwRXJyb3IpIHtcbiAgICAgIHN0YXR1c0NvZGUgPSBlcnJvci5zdGF0dXNDb2RlO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmVuYWJsZUVycm9yTG9nZ2VyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0LnJlc3BvbnNlID0geyAuLi5yZXF1ZXN0LnJlc3BvbnNlLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSksIHN0YXR1c0NvZGUgfTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGFmdGVyLFxuICAgIG9uRXJyb3IsXG4gIH1cbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/libs/middleware.ts\n");

/***/ }),

/***/ "./src/service/apply.service.ts":
/*!**************************************!*\
  !*** ./src/service/apply.service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.apply = void 0;\nconst axios_1 = __importDefault(__webpack_require__(/*! axios */ \"axios\"));\nconst oauth_service_1 = __webpack_require__(/*! ./oauth.service */ \"./src/service/oauth.service.ts\");\nconst aws_multipart_parser_1 = __webpack_require__(/*! aws-multipart-parser */ \"aws-multipart-parser\");\nconst form_data_1 = __importDefault(__webpack_require__(/*! form-data */ \"form-data\"));\nconst apply = async (event) => {\n    const application = event.queryStringParameters;\n    const { careerId } = event.pathParameters;\n    const { resume } = aws_multipart_parser_1.parse(event, true);\n    const { restUrl, BhRestToken } = await oauth_service_1.getSessionData();\n    const challengeName = await getChallengeName(restUrl, BhRestToken, careerId);\n    const newCandidateId = await createWebResponse(careerId, application, resume);\n    return 'success';\n};\nexports.apply = apply;\nconst createWebResponse = async (careerId, application, resume) => {\n    const corpId = '7xjpg0';\n    const swimlane = '32';\n    const webResponseUrl = `https://public-rest${swimlane}.bullhornstaffing.com:443/rest-services/${corpId}/apply/${careerId}/raw`;\n    const form = new form_data_1.default();\n    form.append('resume', resume.content, resume.filename);\n    const res = await axios_1.default.post(webResponseUrl, form, {\n        params: { ...application, externalID: 'Resume', type: 'Resume' },\n        headers: form.getHeaders(),\n    });\n    return res.data.candidate.id;\n};\nconst getChallengeName = async (url, BhRestToken, careerId) => {\n    const applyUrl = `${url}entity/JobOrder/${careerId}`;\n    const { data } = await axios_1.default.get(applyUrl, {\n        params: {\n            BhRestToken,\n            fields: 'customText1',\n        },\n    });\n    return data.data.customText1;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmljZS9hcHBseS5zZXJ2aWNlLnRzLmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBVkE7QUFZQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3Ntb290aHN0YWNrLWNhcmVlcnMtYXBpLy4vc3JjL3NlcnZpY2UvYXBwbHkuc2VydmljZS50cz9jMzI3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHsgZ2V0U2Vzc2lvbkRhdGEgfSBmcm9tICcuL29hdXRoLnNlcnZpY2UnO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tICdhd3MtbXVsdGlwYXJ0LXBhcnNlcic7XG5pbXBvcnQgRm9ybURhdGEgZnJvbSAnZm9ybS1kYXRhJztcblxuZXhwb3J0IGNvbnN0IGFwcGx5ID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCkgPT4ge1xuICBjb25zdCBhcHBsaWNhdGlvbiA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycztcbiAgY29uc3QgeyBjYXJlZXJJZCB9ID0gZXZlbnQucGF0aFBhcmFtZXRlcnM7XG4gIGNvbnN0IHsgcmVzdW1lIH0gPSBwYXJzZShldmVudCwgdHJ1ZSk7XG5cbiAgY29uc3QgeyByZXN0VXJsLCBCaFJlc3RUb2tlbiB9ID0gYXdhaXQgZ2V0U2Vzc2lvbkRhdGEoKTtcblxuICBjb25zdCBjaGFsbGVuZ2VOYW1lID0gYXdhaXQgZ2V0Q2hhbGxlbmdlTmFtZShyZXN0VXJsLCBCaFJlc3RUb2tlbiwgY2FyZWVySWQpO1xuICBjb25zdCBuZXdDYW5kaWRhdGVJZCA9IGF3YWl0IGNyZWF0ZVdlYlJlc3BvbnNlKGNhcmVlcklkLCBhcHBsaWNhdGlvbiwgcmVzdW1lKTtcbiAgcmV0dXJuICdzdWNjZXNzJ1xufTtcblxuY29uc3QgY3JlYXRlV2ViUmVzcG9uc2UgPSBhc3luYyAoY2FyZWVySWQ6IHN0cmluZywgYXBwbGljYXRpb246IGFueSwgcmVzdW1lOiBhbnkpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAvLyB0aGVzZSBhcmUgcHVibGljIG5vbi1zZWNyZXQgdmFsdWVzXG4gIGNvbnN0IGNvcnBJZCA9ICc3eGpwZzAnO1xuICBjb25zdCBzd2ltbGFuZSA9ICczMic7XG4gIGNvbnN0IHdlYlJlc3BvbnNlVXJsID0gYGh0dHBzOi8vcHVibGljLXJlc3Qke3N3aW1sYW5lfS5idWxsaG9ybnN0YWZmaW5nLmNvbTo0NDMvcmVzdC1zZXJ2aWNlcy8ke2NvcnBJZH0vYXBwbHkvJHtjYXJlZXJJZH0vcmF3YDtcblxuICBjb25zdCBmb3JtID0gbmV3IEZvcm1EYXRhKCk7XG4gIGZvcm0uYXBwZW5kKCdyZXN1bWUnLCByZXN1bWUuY29udGVudCwgcmVzdW1lLmZpbGVuYW1lKTtcblxuICBjb25zdCByZXMgPSBhd2FpdCBheGlvcy5wb3N0KHdlYlJlc3BvbnNlVXJsLCBmb3JtLCB7XG4gICAgcGFyYW1zOiB7IC4uLmFwcGxpY2F0aW9uLCBleHRlcm5hbElEOiAnUmVzdW1lJywgdHlwZTogJ1Jlc3VtZScgfSxcbiAgICBoZWFkZXJzOiBmb3JtLmdldEhlYWRlcnMoKSxcbiAgfSk7XG5cbiAgcmV0dXJuIHJlcy5kYXRhLmNhbmRpZGF0ZS5pZDtcbn07XG5cbmNvbnN0IGdldENoYWxsZW5nZU5hbWUgPSBhc3luYyAodXJsOiBzdHJpbmcsIEJoUmVzdFRva2VuOiBzdHJpbmcsIGNhcmVlcklkOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgYXBwbHlVcmwgPSBgJHt1cmx9ZW50aXR5L0pvYk9yZGVyLyR7Y2FyZWVySWR9YDtcbiAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCBheGlvcy5nZXQoYXBwbHlVcmwsIHtcbiAgICBwYXJhbXM6IHtcbiAgICAgIEJoUmVzdFRva2VuLFxuICAgICAgZmllbGRzOiAnY3VzdG9tVGV4dDEnLFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gZGF0YS5kYXRhLmN1c3RvbVRleHQxO1xufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/service/apply.service.ts\n");

/***/ }),

/***/ "./src/service/oauth.service.ts":
/*!**************************************!*\
  !*** ./src/service/oauth.service.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.getSessionData = void 0;\nconst aws_sdk_1 = __webpack_require__(/*! aws-sdk */ \"aws-sdk\");\nconst axios_1 = __importDefault(__webpack_require__(/*! axios */ \"axios\"));\nconst url_1 = __webpack_require__(/*! url */ \"url\");\nconst getBullhornSecrets = async () => {\n    const secretPath = 'smoothstack/bullhorn-credentials';\n    const client = new aws_sdk_1.SecretsManager({\n        region: 'us-east-1',\n    });\n    const res = await client.getSecretValue({ SecretId: secretPath }).promise();\n    return JSON.parse(res.SecretString);\n};\nconst getAuthCode = async (clientId, apiUsername, apiPassword) => {\n    const url = `https://auth.bullhornstaffing.com/oauth/authorize`;\n    const res = await axios_1.default.get(url, {\n        maxRedirects: 0,\n        validateStatus: (status) => status >= 200 && status <= 302,\n        params: {\n            client_id: clientId,\n            username: apiUsername,\n            password: apiPassword,\n            response_type: 'code',\n            action: 'Login',\n        },\n    });\n    const redirectURL = new url_1.URL(res.headers.location);\n    return redirectURL.searchParams.get('code');\n};\nconst getAccessToken = async (clientId, clientSecret, authCode) => {\n    const url = 'https://auth.bullhornstaffing.com/oauth/token';\n    const res = await axios_1.default.post(url, {}, {\n        params: {\n            code: authCode,\n            client_id: clientId,\n            client_secret: clientSecret,\n            grant_type: 'authorization_code',\n        },\n    });\n    return res.data.access_token;\n};\nconst getSessionData = async () => {\n    const { BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD } = await getBullhornSecrets();\n    const authCode = await getAuthCode(BULLHORN_CLIENT_ID, BULLHORN_API_USERNAME, BULLHORN_API_PASSWORD);\n    const accessToken = await getAccessToken(BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET, authCode);\n    const url = 'https://rest.bullhornstaffing.com/rest-services/login';\n    const res = await axios_1.default.get(url, {\n        params: {\n            access_token: accessToken,\n            version: '2.0',\n        },\n    });\n    return res.data;\n};\nexports.getSessionData = getSessionData;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmljZS9vYXV0aC5zZXJ2aWNlLnRzLmpzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFHQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBR0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBZkEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9zbW9vdGhzdGFjay1jYXJlZXJzLWFwaS8uL3NyYy9zZXJ2aWNlL29hdXRoLnNlcnZpY2UudHM/MzJiYSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZWNyZXRzTWFuYWdlciB9IGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcbmltcG9ydCB7IEJ1bGxob3JuQ3JlZGVudGlhbHMgfSBmcm9tICdzcmMvbW9kZWwvQnVsbGhvcm5DcmVkZW50aWFscyc7XG5pbXBvcnQgeyBTZXNzaW9uRGF0YSB9IGZyb20gJ3NyYy9tb2RlbC9TZXNzaW9uRGF0YSc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuXG5jb25zdCBnZXRCdWxsaG9yblNlY3JldHMgPSBhc3luYyAoKTogUHJvbWlzZTxCdWxsaG9ybkNyZWRlbnRpYWxzPiA9PiB7XG4gIGNvbnN0IHNlY3JldFBhdGggPSAnc21vb3Roc3RhY2svYnVsbGhvcm4tY3JlZGVudGlhbHMnO1xuICBjb25zdCBjbGllbnQgPSBuZXcgU2VjcmV0c01hbmFnZXIoe1xuICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gIH0pO1xuXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNsaWVudC5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiBzZWNyZXRQYXRoIH0pLnByb21pc2UoKTtcbiAgcmV0dXJuIEpTT04ucGFyc2UocmVzLlNlY3JldFN0cmluZyk7XG59O1xuXG5jb25zdCBnZXRBdXRoQ29kZSA9IGFzeW5jIChjbGllbnRJZDogc3RyaW5nLCBhcGlVc2VybmFtZTogc3RyaW5nLCBhcGlQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vYXV0aC5idWxsaG9ybnN0YWZmaW5nLmNvbS9vYXV0aC9hdXRob3JpemVgO1xuICBjb25zdCByZXMgPSBhd2FpdCBheGlvcy5nZXQodXJsLCB7XG4gICAgbWF4UmVkaXJlY3RzOiAwLFxuICAgIHZhbGlkYXRlU3RhdHVzOiAoc3RhdHVzKSA9PiBzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8PSAzMDIsXG4gICAgcGFyYW1zOiB7XG4gICAgICBjbGllbnRfaWQ6IGNsaWVudElkLFxuICAgICAgdXNlcm5hbWU6IGFwaVVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQ6IGFwaVBhc3N3b3JkLFxuICAgICAgcmVzcG9uc2VfdHlwZTogJ2NvZGUnLFxuICAgICAgYWN0aW9uOiAnTG9naW4nLFxuICAgIH0sXG4gIH0pO1xuICBjb25zdCByZWRpcmVjdFVSTCA9IG5ldyBVUkwocmVzLmhlYWRlcnMubG9jYXRpb24pO1xuICByZXR1cm4gcmVkaXJlY3RVUkwuc2VhcmNoUGFyYW1zLmdldCgnY29kZScpO1xufTtcblxuY29uc3QgZ2V0QWNjZXNzVG9rZW4gPSBhc3luYyAoY2xpZW50SWQ6IHN0cmluZywgY2xpZW50U2VjcmV0OiBzdHJpbmcsIGF1dGhDb2RlOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgdXJsID0gJ2h0dHBzOi8vYXV0aC5idWxsaG9ybnN0YWZmaW5nLmNvbS9vYXV0aC90b2tlbic7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGF4aW9zLnBvc3QoXG4gICAgdXJsLFxuICAgIHt9LFxuICAgIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBjb2RlOiBhdXRoQ29kZSxcbiAgICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcbiAgICAgICAgY2xpZW50X3NlY3JldDogY2xpZW50U2VjcmV0LFxuICAgICAgICBncmFudF90eXBlOiAnYXV0aG9yaXphdGlvbl9jb2RlJyxcbiAgICAgIH0sXG4gICAgfVxuICApO1xuXG4gIHJldHVybiByZXMuZGF0YS5hY2Nlc3NfdG9rZW47XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0U2Vzc2lvbkRhdGEgPSBhc3luYyAoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4gPT4ge1xuICBjb25zdCB7IEJVTExIT1JOX0NMSUVOVF9JRCwgQlVMTEhPUk5fQ0xJRU5UX1NFQ1JFVCwgQlVMTEhPUk5fQVBJX1VTRVJOQU1FLCBCVUxMSE9STl9BUElfUEFTU1dPUkQgfSA9XG4gICAgYXdhaXQgZ2V0QnVsbGhvcm5TZWNyZXRzKCk7XG4gIGNvbnN0IGF1dGhDb2RlID0gYXdhaXQgZ2V0QXV0aENvZGUoQlVMTEhPUk5fQ0xJRU5UX0lELCBCVUxMSE9STl9BUElfVVNFUk5BTUUsIEJVTExIT1JOX0FQSV9QQVNTV09SRCk7XG4gIGNvbnN0IGFjY2Vzc1Rva2VuID0gYXdhaXQgZ2V0QWNjZXNzVG9rZW4oQlVMTEhPUk5fQ0xJRU5UX0lELCBCVUxMSE9STl9DTElFTlRfU0VDUkVULCBhdXRoQ29kZSk7XG5cbiAgY29uc3QgdXJsID0gJ2h0dHBzOi8vcmVzdC5idWxsaG9ybnN0YWZmaW5nLmNvbS9yZXN0LXNlcnZpY2VzL2xvZ2luJztcbiAgY29uc3QgcmVzID0gYXdhaXQgYXhpb3MuZ2V0KHVybCwge1xuICAgIHBhcmFtczoge1xuICAgICAgYWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlbixcbiAgICAgIHZlcnNpb246ICcyLjAnLFxuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiByZXMuZGF0YTtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/service/oauth.service.ts\n");

/***/ }),

/***/ "@middy/core":
/*!******************************!*\
  !*** external "@middy/core" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("@middy/core");

/***/ }),

/***/ "@middy/http-cors":
/*!***********************************!*\
  !*** external "@middy/http-cors" ***!
  \***********************************/
/***/ ((module) => {

module.exports = require("@middy/http-cors");

/***/ }),

/***/ "@middy/http-json-body-parser":
/*!***********************************************!*\
  !*** external "@middy/http-json-body-parser" ***!
  \***********************************************/
/***/ ((module) => {

module.exports = require("@middy/http-json-body-parser");

/***/ }),

/***/ "aws-multipart-parser":
/*!***************************************!*\
  !*** external "aws-multipart-parser" ***!
  \***************************************/
/***/ ((module) => {

module.exports = require("aws-multipart-parser");

/***/ }),

/***/ "aws-sdk":
/*!**************************!*\
  !*** external "aws-sdk" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("aws-sdk");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

module.exports = require("axios");

/***/ }),

/***/ "form-data":
/*!****************************!*\
  !*** external "form-data" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("form-data");

/***/ }),

/***/ "http-errors":
/*!******************************!*\
  !*** external "http-errors" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("http-errors");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/functions/careers/handler.ts");
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;