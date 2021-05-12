/*
京东到家果园任务脚本,支持qx,loon,shadowrocket,surge,nodejs
用抓包抓 https://daojia.jd.com/html/index.html 页面cookie填写到下面,暂时不知cookie有效期
抓多账号直接清除浏览器缓存再登录新账号,千万别点退出登录,否则cookie失效
cookie只要里面的deviceid_pdj_jd=xxx-xxx-xxx;o2o_m_h5_sid=xxx-xxx-xxx关键信息,填写整个cookie也是可以的
手机设备在boxjs里填写cookie,nodejs在jddj_cookie.js文件里填写cookie
boxjs订阅地址:https://gitee.com/passerby-b/javascript/raw/master/JD/passerby-b.boxjs.json

[task_local]
10 0,8,11,17 * * * https://raw.githubusercontent.com/passerby-b/JDDJ/main/jddj_fruit.js

*/

const $ = new API("jddj_fruit");
let isNotify = true;//是否通知,仅限nodejs,手机用boxjs设置
let thiscookie = '', deviceid = '', nickname = '';
let lat = '30.' + Math.round(Math.random() * (99999 - 10000) + 10000);
let lng = '114.' + Math.round(Math.random() * (99999 - 10000) + 10000);
let cityid = Math.round(Math.random() * (1500 - 1000) + 1000);
let cookies = [], notify = ''; waterNum = 0, waterTimes = 0;
!(async () => {
    if (cookies.length == 0) {
        if ($.env.isNode) { delete require.cache['./jddj_cookie.js']; cookies = require('./jddj_cookie.js') }
        else {
            let ckstr = $.read('#jddj_cookies');
            if (!!ckstr) {
                if (ckstr.indexOf(',') < 0) {
                    cookies.push(ckstr);
                } else {
                    cookies = ckstr.split(',');
                }
            }
        }
    }
    if (cookies.length == 0) {
        console.log(`\r\n请先填写cookie`);
        return;
    }
    if (!$.env.isNode) {
        isNotify = $.read('#jddj_isNotify');
    }
    else {
        notify = require('./sendNotify');
    }

    for (let i = 0; i < cookies.length; i++) {
        console.log(`\r\n★★★★★开始执行第${i + 1}个账号,共${cookies.length}个账号★★★★★`);
        thiscookie = cookies[i];
        waterNum = 0, waterTimes = 0;

        if (!thiscookie.trim()) continue;

        var jsonlist = {};
        var params = thiscookie.split(';');
        params.forEach(item => {
            if (item.indexOf('=') > -1) jsonlist[item.split('=')[0].trim()] = item.split('=')[1].trim();
        });
        deviceid = jsonlist.deviceid_pdj_jd;

        await userinfo();
        await $.wait(1000);

        await treeInfo(0);
        await $.wait(1000);

        let tslist = await taskList();
        if (tslist.code == 1) {
            $.notify('第' + (i + 1) + '个账号cookie过期', '请访问https://daojia.jd.com/html/index.html抓取cookie', { url: 'https://daojia.jd.com/html/index.html' });
            if ($.env.isNode && `${isNotify}` == 'true') {
                await notify.sendNotify('第' + (i + 1) + '个账号cookie过期', '请访问https://daojia.jd.com/html/index.html抓取cookie');
            }
            continue;
        }

        await sign();
        await $.wait(1000);

        await runTask(tslist);
        await $.wait(1000);

        // await zhuLi();
        // await $.wait(1000);

        await treeInfo(1);
        await $.wait(1000);

        await water();
        await $.wait(1000);

        await runTask2(tslist);
        await $.wait(1000);

        await treeInfo(2);
        await $.wait(1000);
    }

})().catch(async (e) => {
    console.log('', `❌失败! 原因: ${e}!`, '');
    if ($.env.isNode && `${isNotify}` == 'true') {
        notify.sendNotify('京东到家果园', `❌失败! 原因: ${e}!`);
    }
}).finally(() => {
    $.done();
})

//个人信息
async function userinfo() {
    return new Promise(async resolve => {
        try {
            let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&platCode=H5&appName=paidaojia&channel=&appVersion=8.7.6&jdDevice=&functionId=mine%2FgetUserAccountInfo&body=%7B%22refPageSource%22:%22%22,%22fromSource%22:2,%22pageSource%22:%22myinfo%22,%22ref%22:%22%22,%22ctp%22:%22myinfo%22%7D&jda=&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', '')

            $.http.get(option).then(response => {
                let data = JSON.parse(response.body);
                if (data.code == 0) {
                    try {
                        nickname = data.result.userInfo.userBaseInfo.nickName;
                        console.log("●●●" + nickname + "●●●");
                    } catch (error) { nickname = '昵称获取失败' }

                }
            })
            resolve();

        } catch (error) {
            console.log('\n【个人信息】:' + error);
            resolve();
        }
    })
}


//任务列表
async function taskList() {
    return new Promise(async resolve => {
        try {
            let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2Flist&isNeedDealError=true&body=%7B%22modelId%22%3A%22M10007%22%2C%22plateCode%22%3A1%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + '&deviceToken=' + deviceid + '&deviceId=' + deviceid, '');
            $.http.get(option).then(response => {
                let data = JSON.parse(response.body);
                resolve(data);
            })

        } catch (error) {
            console.log('\n【任务列表】:' + error);
            resolve({});
        }

    })
}

//浇水
async function water() {
    return new Promise(async resolve => {
        try {
            let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()), 'functionId=fruit%2Fwatering&isNeedDealError=true&method=POST&body=%7B%22waterTime%22%3A1%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '');

            let waterStatus = 1, waterCount = 0;
            do {
                waterCount++;
                console.log(`\n**********开始执行第${waterCount}次浇水**********`);

                $.http.post(option).then(response => {
                    let data = JSON.parse(response.body);
                    console.log('\n【浇水】:' + data.msg);
                    waterStatus = data.code;
                    if (data.code == 0) waterTimes++;
                })
                await $.wait(1000);
            } while (waterStatus == 0);
            resolve();

        } catch (error) {
            console.log('\n【浇水】:' + error);
            resolve();
        }

    })

}

//到家签到
async function sign() {
    return new Promise(async resolve => {
        try {
            let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=signin%2FuserSigninNew&isNeedDealError=true&body=%7B%22channel%22%3A%22daojiaguoyuan%22%2C%22cityId%22%3A' + cityid + '%2C%22longitude%22%3A' + lng + '%2C%22latitude%22%3A' + lat + '%2C%22ifCic%22%3A0%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + '&deviceToken=' + deviceid + '&deviceId=' + deviceid, ``);
            $.http.get(option).then(response => {
                let data = JSON.parse(response.body);
                console.log('\n【到家签到】:' + data.msg);
                resolve();
            })

        } catch (error) {
            console.log('\n【到家签到领水滴】:' + error);
            resolve();
        }

    })
}

//助力
async function zhuLi() {
    return new Promise(async resolve => {
        try {
            let scodes = [];
            await $.http.get({ url: 'https://gitee.com/passerby-b/javascript/raw/master/test/sharecode.js' }).then(response => { scodes = response.body.split(','); })
            let scode = scodes[Math.round(Math.random() * (scodes.length - 1) + 0)];
            let option = urlTask(`https://daojia.jd.com/client?lat=${lat}&lng=${lng}&lat_pos=${lat}&lng_pos=${lng}&city_id=${cityid}&deviceToken=${deviceid}&deviceId=${deviceid}&channel=wx_xcx&mpChannel=wx_xcx&platform=5.0.0&platCode=mini&appVersion=5.0.0&appName=paidaojia&deviceModel=appmodel&xcxVersion=9.2.0&isNeedDealError=true&business=djgyzhuli&functionId=task%2Ffinished&body=%7B%22modelId%22%3A%22M10007%22%2C%22taskType%22%3A1201%2C%22taskId%22%3A%2223eee1c043c01bc%22%2C%22plateCode%22%3A5%2C%22assistTargetPin%22%3A%22${scode.split('@')[0]}%22%2C%22uniqueId%22%3A%22${scode.split('@')[1]}%22%7D`, ``);
            $.http.get(option).then(response => {
                let data = JSON.parse(response.body);
                //console.log('\n【助力】:' + data.msg);
                resolve();
            })
        } catch (error) {
            //console.log('\n【助力】:' + error);
            resolve();
        }
    })
}

//运行任务列表
async function runTask(tslist) {
    return new Promise(async resolve => {
        try {
            for (let index = 0; index < tslist.result.taskInfoList.length; index++) {
                const item = tslist.result.taskInfoList[index];
                if (item.taskType == 307 || item.taskType == 901) {
                    //领取任务
                    let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2Freceived&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                    await $.http.get(option).then(response => {
                        var data = JSON.parse(response.body), msg = '';
                        if (data.code == 0) {
                            msg = data.msg + ',奖励:' + data.result.awardValue;
                        } else {
                            msg = data.msg;
                        }
                        console.log('\n领取任务【' + item.taskTitle + '】:' + msg);
                    })
                }
                if (item.browseTime > -1) {
                    for (let t = 0; t < parseInt(item.browseTime); t++) {
                        await $.wait(1000);
                        console.log('计时:' + (t + 1) + '秒...');
                    }
                }

                //结束任务
                option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2Ffinished&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                await $.http.get(option).then(response => {
                    var data = JSON.parse(response.body), msg = '';
                    if (data.code == 0) {
                        msg = data.msg + ',奖励:' + data.result.awardValue;
                    } else {
                        msg = data.msg;
                    }
                    console.log('\n任务完成【' + item.taskTitle + '】:' + msg);
                })

                //领取奖励
                option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2FsendPrize&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                await $.http.get(option).then(response => {
                    var data = JSON.parse(response.body), msg = '';
                    if (data.code == 0) {
                        msg = data.msg + ',奖励:' + data.result.awardValue;
                    } else {
                        msg = data.msg;
                    }
                    console.log('\n领取奖励【' + item.taskTitle + '】:' + msg);
                })
            }
            resolve();
        } catch (error) {
            console.log('\n【执行任务】:' + error);
            resolve();
        }

    })
}

//限时任务,浇水后运行
async function runTask2(tslist) {
    return new Promise(async resolve => {
        try {
            for (let index = 0; index < tslist.result.taskInfoList.length; index++) {
                const item = tslist.result.taskInfoList[index];
                if (item.taskTitle.indexOf('限时') > -1) {

                    //领取任务
                    let option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2Freceived&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                    await $.http.get(option).then(response => {
                        var data = JSON.parse(response.body), msg = '';
                        if (data.code == 0) {
                            msg = data.msg + ',奖励:' + data.result.awardValue;
                        } else {
                            msg = data.msg;
                        }
                        console.log('\n领取任务【' + item.taskTitle + '】:' + msg);
                    })

                    if (item.browseTime > -1) {
                        for (let t = 0; t < parseInt(item.browseTime); t++) {
                            await $.wait(1000);
                            console.log('计时:' + (t + 1) + '秒...');
                        }
                    }

                    //结束任务
                    option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2Ffinished&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                    await $.http.get(option).then(response => {
                        var data = JSON.parse(response.body), msg = '';
                        if (data.code == 0) {
                            msg = data.msg + ',奖励:' + data.result.awardValue;
                        } else {
                            msg = data.msg;
                        }
                        console.log('\n任务完成【' + item.taskTitle + '】:' + msg);
                    })

                    //领取奖励
                    option = urlTask('https://daojia.jd.com/client?_jdrandom=' + Math.round(new Date()) + '&functionId=task%2FsendPrize&isNeedDealError=true&body=%7B%22modelId%22%3A%22' + item.modelId + '%22%2C%22taskId%22%3A%22' + item.taskId + '%22%2C%22taskType%22%3A' + item.taskType + '%2C%22plateCode%22%3A1%2C%22subNode%22%3Anull%7D&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid + '', ``);
                    await $.http.get(option).then(response => {
                        var data = JSON.parse(response.body), msg = '';
                        if (data.code == 0) {
                            msg = data.msg + ',奖励:' + data.result.awardValue;
                        } else {
                            msg = data.msg;
                        }
                        console.log('\n领取奖励【' + item.taskTitle + '】:' + msg);
                    })
                }
            }
            resolve();
        } catch (error) {
            console.log('\n【执行任务】:' + error);
            resolve();
        }

    })
}

//当前果树详情
async function treeInfo(step) {
    return new Promise(async resolve => {
        try {
            let option = urlTask('https://daojia.jd.com:443/client?_jdrandom=' + Math.round(new Date()), 'functionId=fruit%2FinitFruit&isNeedDealError=true&method=POST&body=%7B%22cityId%22%3A' + cityid + '%2C%22longitude%22%3A' + lng + '%2C%22latitude%22%3A' + lat + '%7D&lat=' + lat + '&lng=' + lng + '&lat_pos=' + lat + '&lng_pos=' + lng + '&city_id=' + cityid + '&channel=ios&platform=6.6.0&platCode=h5&appVersion=6.6.0&appName=paidaojia&deviceModel=appmodel&traceId=' + deviceid + Math.round(new Date()) + '&deviceToken=' + deviceid + '&deviceId=' + deviceid);
            await $.http.post(option).then(async response => {
                let data = JSON.parse(response.body);
                if (data.code == 0) {
                    if (step == 0) {
                        waterNum = data.result.userResponse.waterBalance;
                    }
                    if (step == 2) {
                        waterNum = (waterTimes * 10) + data.result.userResponse.waterBalance - waterNum;//浇水次数*10+剩余水滴-初始水滴
                        if (waterNum < 0) waterNum = 0;

                        if (data.result.activityInfoResponse.curStageLeftProcess == 0) {
                            console.log('\n京东到家果园【' + nickname + '】:' + data.result.activityInfoResponse.fruitName + '已成熟,快去收取!');

                            $.notify('京东到家果园', '【' + nickname + '】', '京东到家果园' + data.result.activityInfoResponse.fruitName + '已成熟,快去收取!');

                            if ($.env.isNode && `${isNotify}` == 'true') {
                                await notify.sendNotify('京东到家果园【' + nickname + '】', '京东到家果园' + data.result.activityInfoResponse.fruitName + '已成熟,快去收取!');
                            }
                        }
                        if (data.result.activityInfoResponse.curStageLeftProcess > 0) {
                            let unit = '次';
                            if (data.result.activityInfoResponse.growingStage == 5) unit = '%';
                            console.log('\n京东到家果园【' + nickname + '】:' + data.result.activityInfoResponse.fruitName + ',本次领取' + waterNum + '滴水,浇水' + waterTimes + '次,还需浇水' + data.result.activityInfoResponse.curStageLeftProcess + unit + data.result.activityInfoResponse.stageName + ',还剩' + data.result.userResponse.waterBalance + '滴水');

                            $.notify('京东到家果园', '【' + nickname + '】', '【果树信息】:' + data.result.activityInfoResponse.fruitName + ',本次领取' + waterNum + '滴水,浇水' + waterTimes + '次,还需浇水' + data.result.activityInfoResponse.curStageLeftProcess + unit + data.result.activityInfoResponse.stageName + ',还剩' + data.result.userResponse.waterBalance + '滴水');

                            if ($.env.isNode && `${isNotify}` == 'true') {
                                await notify.sendNotify('京东到家果园【' + nickname + '】', '【果树信息】:' + data.result.activityInfoResponse.fruitName + ',本次领取' + waterNum + '滴水,浇水' + waterTimes + '次,还需浇水' + data.result.activityInfoResponse.curStageLeftProcess + unit + data.result.activityInfoResponse.stageName + ',还剩' + data.result.userResponse.waterBalance + '滴水');
                            }
                        }
                    }
                }
                resolve();
            })
        } catch (error) {
            console.log('\n【果树信息】:' + error);
            resolve();
        } finally {
            treeInfoTimes = true;
        }

    })
}

function urlTask(url, body) {
    let option = {
        url: url,
        headers: {
            'Host': 'daojia.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded;',
            'Origin': 'https://daojia.jd.com',
            'Cookie': thiscookie,
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148________appName=jdLocal&platform=iOS&commonParams={"sharePackageVersion":"2"}&djAppVersion=8.7.5&supportDJSHWK',
            'Accept-Language': 'zh-cn'
        },
        body: body
    };
    return option;
}

/*********************************** API *************************************/
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
