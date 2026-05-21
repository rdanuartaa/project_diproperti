import { mkdir, readFile, writeFile } from "node:fs/promises";

const runs = [
  {
    name: "Read Only",
    path: new URL("./reports/diproperti-api-readonly-results.json", import.meta.url),
  },
  {
    name: "Mutation Dummy",
    path: new URL("./reports/diproperti-api-mutation-results.json", import.meta.url),
  },
];

function xml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusStyle(failed) {
  return failed > 0 ? "Fail" : "Pass";
}

function requestUrl(request) {
  const url = request?.url;
  if (!url) return "";
  if (typeof url === "string") return url;
  if (url.raw) return url.raw;
  if (Array.isArray(url.host) || Array.isArray(url.path)) {
    const host = Array.isArray(url.host) ? url.host.join(".") : "";
    const path = Array.isArray(url.path) ? url.path.join("/") : "";
    return `${host}${path ? `/${path}` : ""}`;
  }
  return String(url);
}

const parsedRuns = [];
for (const run of runs) {
  const json = JSON.parse(await readFile(run.path, "utf8"));
  parsedRuns.push({ ...run, json });
}

const totalRequests = parsedRuns.reduce((sum, run) => sum + run.json.run.stats.requests.total, 0);
const failedRequests = parsedRuns.reduce((sum, run) => sum + run.json.run.stats.requests.failed, 0);
const totalAssertions = parsedRuns.reduce((sum, run) => sum + run.json.run.stats.assertions.total, 0);
const failedAssertions = parsedRuns.reduce((sum, run) => sum + run.json.run.stats.assertions.failed, 0);

const detailRows = [];
let index = 1;
for (const run of parsedRuns) {
  for (const execution of run.json.run.executions) {
    const assertions = execution.assertions || [];
    const failed = assertions.filter((assertion) => assertion.error).length;
    detailRows.push({
      id: `API-${String(index).padStart(3, "0")}`,
      collection: run.name,
      name: execution.item.name,
      method: execution.request.method,
      url: requestUrl(execution.request),
      code: execution.response?.code ?? "-",
      time: execution.response?.responseTime ?? "-",
      assertions: assertions.length,
      failed,
    });
    index += 1;
  }
}

const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16"/><Interior ss:Color="#D9EAFD" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0050A8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Pass"><Font ss:Bold="1" ss:Color="#087F5B"/><Interior ss:Color="#DFF6E8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Fail"><Font ss:Bold="1" ss:Color="#B42318"/><Interior ss:Color="#FEE4E2" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Note"><Alignment ss:WrapText="1" ss:Vertical="Top"/></Style>
  <Style ss:ID="Wrap"><Alignment ss:WrapText="1" ss:Vertical="Top"/></Style>
 </Styles>
 <Worksheet ss:Name="Ringkasan">
  <Table>
   <Column ss:Width="240"/><Column ss:Width="520"/>
   <Row><Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">Laporan Pengujian API Postman DIPROPERTI</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Tanggal</Data></Cell><Cell><Data ss:Type="String">21 Mei 2026</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Base URL</Data></Cell><Cell><Data ss:Type="String">http://localhost:8000/api</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Tools</Data></Cell><Cell><Data ss:Type="String">Postman collection dijalankan menggunakan Newman</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Request</Data></Cell><Cell><Data ss:Type="Number">${totalRequests}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Request Gagal</Data></Cell><Cell ss:StyleID="${statusStyle(failedRequests)}"><Data ss:Type="Number">${failedRequests}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Total Assertion</Data></Cell><Cell><Data ss:Type="Number">${totalAssertions}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Assertion Gagal</Data></Cell><Cell ss:StyleID="${statusStyle(failedAssertions)}"><Data ss:Type="Number">${failedAssertions}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Kesimpulan</Data></Cell><Cell ss:StyleID="${statusStyle(failedRequests + failedAssertions)}"><Data ss:Type="String">${failedRequests + failedAssertions === 0 ? "LULUS" : "PERLU PERBAIKAN"}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Catatan</Data></Cell><Cell ss:StyleID="Note"><Data ss:Type="String">Collection read-only menguji endpoint public, auth, dan admin list/detail. Collection mutation dummy menguji create, update, delete data dummy lalu cleanup.</Data></Cell></Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Detail Request">
  <Table>
   <Column ss:Width="80"/><Column ss:Width="150"/><Column ss:Width="260"/><Column ss:Width="80"/><Column ss:Width="430"/><Column ss:Width="80"/><Column ss:Width="90"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="100"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Collection</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Request</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Method</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">URL</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Time ms</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Assertions</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Failed</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Hasil</Data></Cell>
   </Row>
   ${detailRows.map((row) => `<Row><Cell><Data ss:Type="String">${xml(row.id)}</Data></Cell><Cell><Data ss:Type="String">${xml(row.collection)}</Data></Cell><Cell ss:StyleID="Wrap"><Data ss:Type="String">${xml(row.name)}</Data></Cell><Cell><Data ss:Type="String">${xml(row.method)}</Data></Cell><Cell ss:StyleID="Wrap"><Data ss:Type="String">${xml(row.url)}</Data></Cell><Cell><Data ss:Type="Number">${row.code}</Data></Cell><Cell><Data ss:Type="Number">${row.time}</Data></Cell><Cell><Data ss:Type="Number">${row.assertions}</Data></Cell><Cell ss:StyleID="${statusStyle(row.failed)}"><Data ss:Type="Number">${row.failed}</Data></Cell><Cell ss:StyleID="${statusStyle(row.failed)}"><Data ss:Type="String">${row.failed ? "Gagal" : "Lulus"}</Data></Cell></Row>`).join("\n   ")}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="File Postman">
  <Table>
   <Column ss:Width="260"/><Column ss:Width="560"/>
   <Row><Cell ss:StyleID="Header"><Data ss:Type="String">File</Data></Cell><Cell ss:StyleID="Header"><Data ss:Type="String">Keterangan</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">diproperti-api-readonly.postman_collection.json</Data></Cell><Cell ss:StyleID="Note"><Data ss:Type="String">Collection endpoint aman/read-only untuk public, auth, dan admin read-only.</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">diproperti-api-mutation.postman_collection.json</Data></Cell><Cell ss:StyleID="Note"><Data ss:Type="String">Collection endpoint mutasi data dummy untuk profile, tag, FAQ, artikel, properti, dan logout.</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">diproperti-local.postman_environment.json</Data></Cell><Cell ss:StyleID="Note"><Data ss:Type="String">Environment lokal berisi base URL dan token test yang dibuat dari database lokal.</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;

await mkdir(new URL("./reports/", import.meta.url), { recursive: true });
await writeFile(new URL("./reports/laporan-api-postman-test.xls", import.meta.url), workbook);
console.log("Laporan API Postman dibuat.");
