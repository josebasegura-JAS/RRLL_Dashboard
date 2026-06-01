const { MsgReader } = require("@kenjiuno/msgreader");

function readMsgTextPayload(buffer) {
  const latin1 = Buffer.from(buffer).toString("latin1");
  const utf16 = Buffer.from(buffer).toString("utf16le");
  return `${latin1}\n${utf16}`.replace(/\0/g, " ");
}

function parseOutlookMsgBuffer(buffer) {
  try {
    const data = new MsgReader(new Uint8Array(buffer)).getFileData() || {};
    return {
      ok: true,
      data: {
        subject: String(data.subject || "").trim(),
        body: String(data.body || "").trim(),
        htmlBody: String(data.bodyHTML || data.html || "").trim(),
        senderName: String(data.senderName || "").trim(),
        senderEmail: String(data.senderEmail || "").trim(),
        date: String(data.messageDeliveryTime || data.deliveryTime || data.creationTime || "").trim()
      }
    };
  } catch (parseError) {
    console.warn("Parser .msg avanzado falló, usando fallback básico:", parseError);
    const text = readMsgTextPayload(buffer);
    const subject = (text.match(/(?:subject|asunto)\s*[:=]\s*([^\r\n]{3,200})/i) || [])[1] || "";
    const senderName = (text.match(/(?:from|de)\s*[:=]\s*([^\r\n<]{3,120})/i) || [])[1] || "";
    const senderEmail = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || "";
    const date = (text.match(/(?:sent|fecha)\s*[:=]\s*([^\r\n]{4,80})/i) || [])[1] || "";
    const body = text.slice(0, 10000);
    return {
      ok: !!(subject || body),
      data: { subject: subject.trim(), body, htmlBody: "", senderName: senderName.trim(), senderEmail: senderEmail.trim(), date: String(date).trim() }
    };
  }
}

module.exports = {
  parseOutlookMsgBuffer,
  readMsgTextPayload
};
