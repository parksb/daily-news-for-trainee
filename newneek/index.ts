import * as dotenv from 'dotenv';
import * as thecamp from 'the-camp-lib';
import * as requestPromise from 'request-promise';
import * as cheerio from 'cheerio';

async function getNews() {
  const options = (url: string) => {
    return {
      url,
      method: 'GET',
    };
  }

  const contentUrl = async () => {
    const listResponse = await requestPromise(options('https://newneek.co/library'));
    const $ = cheerio.load(listResponse);
    return $('.col-dz.col-dz-.col-xdz.col-xdz-12 ._widget_data > .widget._text_wrap.widget_text_wrap.fr-view > div:nth-child(2) > div:nth-child(1) > p:nth-child(3) > span:nth-child(1) > a:nth-child(1)')[0].attribs.href;
  };

  const contentResponse = await requestPromise(options(await contentUrl()));
  const $ = cheerio.load(contentResponse, { decodeEntities: false });

  const title = $('.view_tit').text();
  $('.stb-block.share.noBorder').remove();
  return { title, content: $('.inner').html() };
}

(async () => {
  dotenv.config();

  const id = process.env.USER_ID || '';
  const password = process.env.USER_PWD || '';

  const name = process.env.TRAINEE_NAME || '';
  const birth = process.env.TRAINEE_BIRTH || '';
  const enterDate = process.env.ENTER_DATE || '';
  const className = process.env.CLASS_NAME as thecamp.SoldierClassName;
  const groupName = process.env.GROUP_NAME as thecamp.SoldierGroupName;
  const unitName = process.env.UNIT_NAME as thecamp.SoldierUnitName;

  const soldier = new thecamp.Soldier(
    name,
    birth,
    enterDate,
    className,
    groupName,
    unitName,
    thecamp.SoldierRelationship.FRIEND,
  );

  const cookies = await thecamp.login(id, password);
  await thecamp.addSoldier(cookies, soldier);
  const [trainee] = await thecamp.fetchSoldiers(cookies, soldier);

  const { title, content } = await getNews();
  const message = new thecamp.Message(
    title,
    content,
    trainee.getTraineeMgrSeq()
  );

  await thecamp.sendMessage(cookies, trainee, message);
})();
