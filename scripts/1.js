const $ = new Env('新潮品牌狂欢');

const ll=`"lat":"114.495085","lng":"30.467595"`

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '',notice='',share=[];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  console.log(`获取助力码，账号内循环助力\n`);
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      await TotalBean()
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      await mcxhd_brandcity_getshare()
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.sum=0
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      notice +=`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`
      await mcxhd_brandcity()
    }
  }
  await showMsg()
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })

async function showMsg() {
  if ($.isNode()) {
    await notify.sendNotify(`新潮品牌狂欢`, notice);
  }
}
async function mcxhd_brandcity() {
  await mcxhd_brandcity_taskList()
  await mcxhd_brandcity_homePage()
  while($.remainNum>0){
    await mcxhd_brandcity_startGame()
    console.log(`等待3秒后上报分数`)
    await $.wait(3000)
    await mcxhd_brandcity_reportGame()
  }
  notice += `共获得${$.sum}京豆`
}

function mcxhd_brandcity_homePage() {
  	return new Promise(resolve => {
      body=encodeURI(`{"token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_homePage`,body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            $.remainNum=data.result.remainNum
            console.log(`剩余${$.remainNum}机会`)
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function mcxhd_brandcity_startGame() {
    return new Promise(resolve => {
      body=encodeURI(`{"token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_startGame`,body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            $.remainNum=data.result.remainNum-1
            $.passScore=data.result.passScore
            console.log(`开始游戏`)
            console.log(`剩余${$.remainNum}机会`)
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function mcxhd_brandcity_reportGame() {
    return new Promise(resolve => {
      score=randomNum($.passScore+50,$.passScore+100)
      body=encodeURI(`{"token":"jd17919499fb7031e5","score":${score}}`)
    $.get(taskurl(`mcxhd_brandcity_reportGame`,body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            gift=data.result.gift
            coupons=data.result.gift.coupons[0]
            $.sum +=gift.jbeanNum
            console.log(`上报完成，分数：${score}`)
            console.log(`获得${gift.jbeanNum}京豆`)
            console.log(`额外奖品：${JSON.stringify(coupons)}\n`)
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function mcxhd_brandcity_getshare() {
    return new Promise(resolve => {
      body=encodeURI(`{${ll},"token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_taskList`,body), async(err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            itemToken=data.result.tasks[3].subItem[0].itemToken
            share[$.index-1]=itemToken
            console.log(`助力码：${itemToken}`)
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}


function mcxhd_brandcity_taskList() {
    return new Promise(resolve => {
      body=encodeURI(`{${ll},"token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_taskList`,body), async(err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            tasks=data.result.tasks
            for (var i = 0; i < tasks.length; i++) {
              console.log(`\n开始${tasks[i].taskName}\n`)
              subItem=tasks[i].subItem
              taskId=tasks[i].taskId
              for (var j = 0; j < subItem.length; j++) {
                if ('4'==taskId) {
                  for(let n=0; n<share.length;n++){
                    await mcxhd_brandcity_doTask(share[n])
                    await $.wait(1000)
                  }
                } else {
                  itemToken=subItem[j].itemToken
                  await mcxhd_brandcity_doTask(itemToken)
                  await $.wait(1000)
                }
              }
            }
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function mcxhd_brandcity_doTask(itemToken) {
    return new Promise(resolve => {
    body=encodeURI(`{"itemToken":"${itemToken}","token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_doTask`,body), async(err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            taskId=data.result.taskId
            if (taskId=='3') {
              $.Token=data.result.itemToken
              taskToken=data.result.taskToken
              await queryVkComponent(taskToken)
              await $.wait(5500)
              await qryViewkitCallbackResult(taskToken)
              await mcxhd_brandcity_checkTaskStatus($.Token)
            }else{
              console.log(`已完成${data.result.times}次`)
            }
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function mcxhd_brandcity_checkTaskStatus(itemToken1) {
    return new Promise(resolve => {
    body=encodeURI(`{"itemToken":"${itemToken1}","token":"jd17919499fb7031e5"}`)
    $.get(taskurl(`mcxhd_brandcity_checkTaskStatus`,body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          if (data.retCode==200) {
            console.log(`已完成${data.result.times}次`)
          } else{
            console.log(data.retMessage)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

function queryVkComponent(taskToken) {
    return new Promise(resolve => {
    const options = {
      url: `https://api.m.jd.com/?client=wh5&clientVersion=1.0.0&functionId=queryVkComponent&body={%22businessId%22:%22strategy%22,%22componentId%22:%22f6e2c64666f54b46868496f290f181e6%22,%22taskParam%22:%22%257B%2522taskToken%2522%3A%2522${taskToken}%2522%257D%22}&_timestamp=${(new Date()).getTime()}`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "origin": 'https://h5.m.jd.com',
        "referer": 'https://h5.m.jd.com/',
        "user-agent": `jdapp;android;10.0.2;10;3353234393134326-3673735303632613;network/wifi;model/MI 8;addressid/138719729;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;osVer/29;appBuild/88548;partner/jingdong;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36`
      }
    }
    $.get(options, async(err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          console.log(data.returnMsg)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}


function qryViewkitCallbackResult(taskToken) {
    return new Promise(resolve => {
    const options = {
      url: `https://api.m.jd.com/?client=wh5&clientVersion=1.0.0&functionId=qryViewkitCallbackResult&body={"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{'taskToken':'${taskToken}'}","sdkVersion":"1.0.0","clientLanguage":"zh"}&_timestamp=${(new Date()).getTime()}`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "origin": 'https://h5.m.jd.com',
        "referer": 'https://h5.m.jd.com/',
        "user-agent": `jdapp;android;10.0.2;10;3353234393134326-3673735303632613;network/wifi;model/MI 8;addressid/138719729;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;osVer/29;appBuild/88548;partner/jingdong;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36`
      }
    }
    $.get(options, async(err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data)
          // console.log(JSON.stringify(data))
          console.log(data.returnMsg)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}


function taskurl(functionId,body){
  return {
    url: `https://api.m.jd.com/client.action?functionId=${functionId}&appid=publicUseApi&body=${body}&t=${(new Date()).getTime()}&client=wh5&clientVersion=1.0.0&sid=a0afc6f518c32fa6becd8bb6c645fa5w&uuid=3353234393134326-3673735303632613&area=17_1413_4078_52280&networkType=wifi`,
    headers: {
      "accept": "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
      "cookie": cookie,
      "origin": 'https://h5.m.jd.com',
      "referer": 'https://h5.m.jd.com/',
      "user-agent": `jdapp;android;10.0.2;10;3353234393134326-3673735303632613;network/wifi;model/MI 8;addressid/138719729;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;osVer/29;appBuild/88548;partner/jingdong;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36`
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": `jdapp;android;9.3.5;10;3353234393134326-3673735303632613;network/wifi;model/MI 8;addressid/138719729;aid/3524914bc77506b1;oaid/274aeb3d01b03a22;osVer/29;appBuild/86390;psn/Mp0dlaZf4czQtfPNMEfpcYU9S/f2Vv4y|2255;psq/1;adk/;ads/;pap/JA2015_311210|9.3.5|ANDROID 10;osv/10;pv/2039.1;jdv/0|androidapp|t_335139774|appshare|QQfriends|1611211482018|1611211495;ref/com.jingdong.app.mall.home.JDHomeFragment;partner/jingdong;apprpd/Home_Main;eufv/1;jdSupportDarkMode/0;Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36`
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13||data['retcode'] === 101) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function randomNum(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
            return parseInt(Math.random()*minNum+1,10); 
        break; 
        case 2: 
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
        break; 
            default: 
                return 0; 
            break; 
    } 
} 

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}