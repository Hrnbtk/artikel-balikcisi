// Uygulama içi köprü. Telefonda (ya da tarayıcıda sayfa adresine ?app eklenince) oyunu
// tam ekran uygulama görünümüne alır; telefonda ayrıca:
//  - oyunun "indir" düğmeleri (tarayıcıda claude.use('downloads')) sistemin paylaş menüsünü açar
//  - kayıt telefonun kalıcı ayarlarına yedeklenir
//  - Android geri tuşu ve uygulama arka plana gidince duraklatma
(function(){
  var C=window.capacitorExports;
  var native=!!(C&&C.Capacitor&&C.Capacitor.isNativePlatform());
  if(!native&&!/[?&]app\b/.test(location.search))return;
  var root=document.documentElement;
  root.classList.add('app-mode');
  if(native)root.classList.add('native-app');
  var $=function(id){return document.getElementById(id);};

  function showPanel(name){root.classList.add('show-'+name);var s=$(name);if(s)s.scrollTop=0;}
  function closePanels(){var open=/show-(hikaye|nasil)/.test(root.className);root.classList.remove('show-hikaye','show-nasil');return open;}
  function introOpen(){var i=$('intro');return i&&!i.hidden&&!i.classList.contains('out');}
  function openDialog(){return document.querySelector('dialog[open]');}

  document.addEventListener('DOMContentLoaded',function(){
    // Hikaye düğmesi sayfayı kaydırmak yerine paneli açsın
    document.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('#introStory')){e.stopImmediatePropagation();e.preventDefault();showPanel('hikaye');}
    },true);
    var menu=document.querySelector('#intro .menu');
    if(menu){var b=document.createElement('button');b.type='button';b.className='btn ghost';b.textContent='Nasıl oynanır';
      b.addEventListener('click',function(){showPanel('nasil');});menu.appendChild(b);}
    ['hikaye','nasil'].forEach(function(id){var s=$(id);if(!s)return;var x=document.createElement('button');
      x.type='button';x.className='app-close';x.textContent='✕ Kapat';x.addEventListener('click',closePanels);s.insertBefore(x,s.firstChild);});
    // telefonda oyun alanına kaydırma gerekmez
    addEventListener('scroll',function(){if(scrollY)scrollTo(0,0);},{passive:true});
  });

  if(!native)return;

  var Filesystem=C.registerPlugin('Filesystem'),Share=C.registerPlugin('Share'),App=C.registerPlugin('App'),
      StatusBar=C.registerPlugin('StatusBar'),SplashScreen=C.registerPlugin('SplashScreen'),Preferences=C.registerPlugin('Preferences');

  var downloads={save:async function(o){
    var r=await Filesystem.writeFile({path:o.filename,data:o.data,directory:'CACHE',encoding:'utf8',recursive:true});
    try{await Share.share({title:o.filename,files:[r.uri]});}
    catch(e){if(/cancel/i.test(String(e&&e.message)))throw {code:'declined'};throw e;}
  }};
  window.claude={use:function(name){return name==='downloads'?Promise.resolve(downloads):Promise.reject(new Error('yok'));}};

  // Kayıt yedeği: iOS/Android, yer daralınca web görünümünün localStorage'ını nadiren silebilir.
  // Oyunun kaydını yerel ayarlara da yazıyoruz; localStorage boş açılırsa yedekten geri yükleyip sayfayı yeniliyoruz.
  var KEY_PREFIX='artikel-balikcisi';
  try{
    var origSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){origSet.call(this,k,v);
      if(this===window.localStorage&&String(k).indexOf(KEY_PREFIX)===0)Preferences.set({key:String(k),value:String(v)}).catch(function(){});};
    Preferences.keys().then(function(r){var restored=false;
      return Promise.all((r.keys||[]).filter(function(k){return k.indexOf(KEY_PREFIX)===0&&localStorage.getItem(k)===null;})
        .map(function(k){return Preferences.get({key:k}).then(function(g){if(g.value!=null){origSet.call(localStorage,k,g.value);restored=true;}});}))
        .then(function(){if(restored)location.reload();});
    }).catch(function(){});
  }catch(e){}

  // Android geri tuşu: paneli kapat, pencereyi kapat, oyunda duraklat, ana menüde uygulamadan çık
  App.addListener('backButton',function(){
    if(closePanels())return;
    var d=openDialog();if(d){d.close();return;}
    if(introOpen()){App.exitApp();return;}
    var m=$('menuBtn');if(m)m.click();
  });
  // uygulama arka plana gidince oyunu duraklat
  App.addListener('pause',function(){if(!introOpen()&&!openDialog()){var m=$('menuBtn');if(m)m.click();}});

  StatusBar.setStyle({style:'DARK'}).catch(function(){});
  addEventListener('load',function(){setTimeout(function(){SplashScreen.hide().catch(function(){});},150);});
})();
