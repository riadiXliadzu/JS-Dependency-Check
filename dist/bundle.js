#! /usr/bin/env node
import e from"path";import{promises as t}from"fs";import n from"semver/functions/gte.js";import r from"axios";import a from"semver/functions/diff.js";import s from"app-root-path";const o=(e={})=>Object.keys(e).map((t=>({package:t,version:e[t]}))),d=(e,t)=>{let r=0;return{template:e.length?`\n                    <h2>${t}</h2>\n                <table id="result-table-${t} style="width:100%">\n                    <thead>\n                        <tr>\n                        <td>Package</td>\n                        <td>Current Version</td>\n                        <td>Current Release Date</td>\n                        <td>Latest Version</td>\n                        <td>Latest Version Release Date</td>\n                        <td>Status</td>\n                        <td> Upgrade Type </td>\n                        <td> Link to package in registry </td>\n                        <td> Link to package on NPM </td>\n                        </tr>\n                    </thead>\n                    <tbody>\n                       ${e.map((({package:e})=>{const{name:t,registry_url:a,npm_url:s,latest:o,current:d,upgradeType:i}=e,c=((e,t)=>"ERROR"===e||"ERROR"===t?"UNKNOWN":n(t,e)?"UP TO DATE":"OUTDATED")(o.version,d.version);"OUTDATED"===c&&r++;const p=new Date(d.releaseDate).toLocaleDateString(),l=new Date(o.releaseDate).toLocaleDateString();return`<tr>\n                        <td>${t}</td>\n                        <td> ${d.version} </td>\n                        <td>${p}</td>\n                        <td>${o.version} </td>\n                         <td>${l}</td>\n                        <td style=${(e=>{if("N/A"===e)return"background-color:green";switch(e){case"PATCH":return"background-color:yellowgreen";case"PREPATCH":case"PREMINOR":case"MINOR":return"background-color:yellow";default:return"background-color:red"}})(i.toUpperCase())}>${c}</td>\n                        <td> ${i.toUpperCase()} </td>\n                        <td> <a href=${a} target="_blank"> ${a} </a> </td>\n                        <td> <a href=${s} target="_blank"> ${s} </a> </td>\n                        </tr>`})).join("")}\n                    </tbody>\n                    </table>`:"",outdated_counter:r}},i=process.env.DEP_CHECK_WHITELIST||[],c=async(e,t)=>{try{const n=[],r=((e,t)=>t.filter((t=>!e.includes(t.package))))(t,e),a=await Promise.all(r.map((async e=>{const t=await p({package:e.package});return await u(t,e)})));return{successfulLookups:a.filter((e=>!e.package.error||(n.push(e),!1))),failedLookups:n}}catch(e){console.error(e),process.exit(1)}},p=async({package:e})=>{const t=`https://registry.npmjs.org/${e}`;try{const{data:e}=await r.get(t),{time:n}=e;return{versionTimeline:n,tags:e["dist-tags"]}}catch(n){return console.error(`There was an issue searching the registry for ${e}, skipping...`),{error:!0,name:e,url:t,stackTrace:n}}},l=({name:e,versionTimeline:t,latest:n,definedVersion:r,error:s=!1,currentPackage:o,stackTrace:d})=>s?{package:{error:s,name:o.package,version:o.version,stackTrace:d}}:{package:{name:e,registry_url:`https://registry.npmjs.org/${e}`,npm_url:`https://www.npmjs.com/package/${e}`,latest:{version:n||r,releaseDate:t[n]||t[r]},current:{version:r,releaseDate:t[r]},upgradeType:a(r,n||r)||"N/A",error:s}},u=async({versionTimeline:e,tags:t,error:r=!1,stackTrace:a},s)=>new Promise(((o,d)=>{try{if(r)return o(l({error:r,currentPackage:s,stackTrace:a}));const d=(()=>{if(Number.isNaN(Number.parseFloat(s.version))){const e=s.version.split(""),[t,...n]=e;return n.join("")}return s.version})(),{latest:i}=t;let c={};c=n(d,i)?l({name:s.package,versionTimeline:e,definedVersion:d}):l({name:s.package,versionTimeline:e,latest:i,definedVersion:d}),o(c)}catch(e){console.warn(e),d(e)}}));global.__basedir=s.path;const g=await(async()=>{const n=e.join(__basedir,"package.json"),r=JSON.parse(await(async({path:e,encoding:n,...r})=>{try{return t.readFile(e)}catch(t){console.error(`Error reading file ${e}`),console.error(t),process.exit(1)}})({path:n}));return{repoInfo:{name:r.name||"",version:r.version||""},dependencies:o(r.dependencies)||[],peerDependencies:o(r.peerDependencies)||[],devDependencies:o(r.devDependencies)||[]}})(),{peerDependencies:h,dependencies:k,devDependencies:m,repoInfo:b}=g,v=await(async({peerDependencies:e=[],devDependencies:t=[],dependencies:n=[]})=>{const r=[],a=i.length>0?i.split(","):[],{successfulLookups:s,failedLookups:o}=await c(e,a),{successfulLookups:d,failedLookups:p}=await c(t,a),{successfulLookups:l,failedLookups:u}=await c(n,a);return r.push(...u,...p,...o),{peerDependenciesResult:s,devDependenciesResult:d,dependenciesResult:l,failedLookupResult:r}})({peerDependencies:h,dependencies:k,devDependencies:m}),f=(({peerDependenciesResult:e,devDependenciesResult:t,dependenciesResult:n,failedLookupResult:r})=>{const{template:a,outdated_counter:s}=d(n,"Dependencies"),{template:o,outdated_counter:i}=d(t,"Dev Dependencies"),{template:c,outdated_counter:p}=d(e,"Peer Dependencies"),{errorTable:l}=((e=[])=>({errorTable:e.length?`\n                    <h2>Failed Lookups </h2>\n                    <h4>We couldn't locate the packages below in the public npm registry </h4>\n                <table id="result-table-error style="width:100%">\n                    <thead>\n                        <tr>\n                        <td>Package</td>\n                        <td>Current Version</td>\n                        <td>Status</td>\n                        <td>Response Code</td>\n                    </thead>\n                    <tbody>\n                       ${e.map((({package:e})=>`<tr>\n                           <td>${e.name}</td>\n                           <td>${e.version}</td>\n                           <td>UNKNOWN</td>\n                           <td>${e.stackTrace.toString()}</td>\n                           </tr>`)).join("")}\n                    </tbody>\n                    </table>`:""}))(r);return`\n        <html>\n        <title> Dependency Check -- Report </title>\n        <head>\n        </head>\n        <style>\n        {\n        font-family: Arial, Helvetica, sans-serif;\n        border-collapse: collapse;\n        width: 100%;\n        }\n        \n        table {\n            width:100%;\n        }\n\n         td, th {\n        border: 1px solid #ddd;\n        padding: 8px;\n        }\n        tr {\n            cursor: pointer;\n        }\n        tr:nth-child(even){background-color: #f2f2f2;}\n\n        tr:hover {background-color: #ddd;}\n\n        #th {\n        padding-top: 12px;\n        padding-bottom: 12px;\n        text-align: left;\n        background-color: #04AA6D;\n        color: white;\n        }\n        </style>\n    \n        <body>\n        <h1> Results Below: </h1>\n        <h3>${(()=>{const e=i+p+s;return 0==e?`🎉 There are ${e} Packages that need to be updated. Woohoo! `:1==e?`⚠️ There is ${e} Package that needs to be updated - Not bad! `:e>1&&e<10?`⚠️ There are  ${e} Packages that need to be updated`:e>=10?`​​⚠️​😱​ Ouch... There are ${e} Packages that need to be updated 🙈 Good Luck! `:void 0})()} </h3>\n        <div class="dep-table">\n                ${a}\n        </div>\n        <div class="dev-table">\n                ${o}\n        </div>\n        <div class="peer-table">\n                ${c}\n        </div>\n        <div class="error-table">\n            ${l}\n        </div>\n        </body>\n    `})(v);await(async n=>{try{const r=e.join(__basedir,"dependency-status-report.html");await t.writeFile(r,n),console.log(`Wrote report to ${r}`)}catch(e){console.error(e)}})(f);
