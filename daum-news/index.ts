import * as dotenv from 'dotenv';
import * as rssParser from 'rss-parser';
import * as thecamp from 'the-camp-lib';

async function setMessage() {
  const parser = new rssParser();
  const xml = 'http://media.daum.net/rss/today/primary/all/rss2.xml'; // 다음뉴스 종합
  let message: string = '';

  const convertor = (text: string | undefined) => {
    return (text || '').replace(/&quot;/g, '\"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
  };

  const feed = await parser.parseURL(xml);

  feed.items!.forEach((item) => {
    const title = convertor(item.title);
    let content = convertor(item.content);

    if (content.startsWith('(끝)본 기사는 인포맥스 금융정보 단말기에서 2시간 더 빠른')) {
      content = '';
    } else {
      content = content.slice(0, content.indexOf('다.') + 1);
      content = content.replace(/^(\*그림\d\*)?(\(|\[|【)\s?.*=.*\s?(\)|\]|】)\s?/, '')
          .replace(/^[가-힣]{2,3}\s(기자|특파원)\s=\s/, '');
      content += '\n';
    }

    message = `${message}\n# ${title}\n${content}`;
  });

  return message.slice(0, 2000);
}

(async () => {
  dotenv.config();

  const id = process.env.USER_ID;
  const password = process.env.USER_PWD;

  const traineeName = process.env.TRAINEE_NAME;
  const unitName = process.env.UNIT_NAME;
  const enterDate = process.env.ENTER_DATE;
  const birth = Number(process.env.TRAINEE_BIRTH);

  const cookies = await thecamp.login(id, password);
  const [group] = await thecamp.fetchGroups(cookies, unitName, enterDate);

  const trainee = {
    birth,
    traineeName,
    unitCode: group.unitCode,
    groupId: group.groupId,
    relationship: thecamp.Relationship.FRIEND,
  };

  const message = {
    title: `${new Date().getMonth() + 1}월 ${new Date().getDate()}일 (${new Date().getHours()}시 ${new Date().getMinutes()}분) - 다음뉴스 종합`,
    content: (await setMessage()),
  };

  await thecamp.sendMessage(cookies, trainee, message);
})();

