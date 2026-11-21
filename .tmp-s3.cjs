const { Client } = require("pg");
const cmd = process.argv[2];
(async () => {
  const c = new Client({ connectionString: process.env.DB_URL });
  await c.connect();
  if (cmd === "promote") await c.query("update users set role='admin' where username='thanhvien1'");
  if (cmd === "demote") {
    await c.query("update users set role='member' where username='thanhvien1'");
    await c.query("delete from skills where slug='test-s3'");
    await c.query("delete from files where original_name like 's3-test%'");
  }
  if (cmd === "publish") {
    const f = await c.query(
      "insert into files(kind,mime,size_bytes,storage_key,original_name) values('image','image/jpeg',4,'image/s3-test.jpg','s3-test-cover.jpg') returning id",
    );
    await c.query(
      "insert into skills(slug,title,status,cover_file_id,published_at) values('test-s3','Bài test',$1,$2,now())",
      ["published", f.rows[0].id],
    );
    console.log("published file", f.rows[0].id);
  }
  if (cmd === "draft") {
    const f = await c.query(
      "insert into files(kind,mime,size_bytes,storage_key,original_name) values('image','image/jpeg',4,'image/s3-draft.jpg','s3-test-draft.jpg') returning id",
    );
    console.log("draft file", f.rows[0].id);
  }
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
