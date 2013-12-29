/*
http://stackoverflow.com/questions/3146483/html5-file-api-read-as-text-and-binary

automatic open file without user interaction
http://stackoverflow.com/questions/18251432/read-a-local-file-using-javascript-html5-file-api-offline-website
*/
var _read=function(handle,position,length,callback) {
    var reader = new FileReader();
    //reader.onerror = errorHandler;
    reader.onload = function(e) {
      callback(e.target.result);
    };
    var blob = handle.slice(position,position+length);
    reader.readAsBinaryString(blob);
}

var read=function(handle,buffer,offset,length,position,cb) {	 //buffer and offset is not used
	if (handle._buf)	{
		cb(0,length,handle._buf.substring(position,position+length));
	} else {
	  _read(handle, position,length, function(result) {
	  	cb(0,length,result);
	  });		
	}
}

var close=function(handle) {
	//nop
}
var fstat=function(handle,cb) {
	setTimeout(
		(function(){
			cb(0,{size:handle.size,mtime:handle.lastModifiedDate});
		})
	,0);
}
var readEntireFile=function(handle,cb) {
	_read(handle,0,handle.size,function(data){
		handle._buf=data;
		cb(0,handle);
	})
}
var chosefile=function(entryname,cb,autoload){
	chrome.fileSystem.chooseEntry({type:"openFile"},function(entry){
    	  var opts={};
    	  opts[entryname]=chrome.fileSystem.retainEntry(entry);
    		chrome.storage.local.set(opts);
    		entry.file(function(handle){
    			if (autoload)	readEntireFile(handle,cb);
    			else cb(0,handle);
    		});
  });	
}

var open=function(filename,mode,cb,autoload) {
	var entryname='entry!'+filename;
  // see if the app retained access to an earlier file or directory
  chrome.storage.local.get(entryname, function(items) {
    if (items[entryname]) {
      chrome.fileSystem.isRestorable(items[entryname], function(bIsRestorable) {
        chrome.fileSystem.restoreEntry(items[entryname], function(chosenEntry) {
          if (chosenEntry) {
          	chosenEntry.file(function(handle) {
          		if (autoload) readEntireFile(handle,cb);
          		else cb(0,handle);
          	});
          	return;
          }
        });
      });
    } else chosefile(entryname,cb,autoload);
  });
}


module.exports={open:open,read:read,fstat:fstat,close:close}