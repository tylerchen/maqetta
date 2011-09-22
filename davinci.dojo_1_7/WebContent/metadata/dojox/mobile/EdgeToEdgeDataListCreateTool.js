dojo.provide("davinci.libraries.dojo.dojox.mobile.EdgeToEdgeDataListCreateTool");

dojo.require("davinci.ve.widget");
dojo.require("davinci.commands.CompoundCommand");
dojo.require("davinci.ve.commands.AddCommand");
dojo.require("davinci.ve.commands.MoveCommand");
dojo.require("davinci.ve.commands.ResizeCommand");
dojo.require("davinci.ve.tools.CreateTool");

// NOTE: Used by EdgeToEdgeDataList, RoundRectDataList, Carousel

dojo.declare("davinci.libraries.dojo.dojox.mobile.EdgeToEdgeDataListCreateTool", davinci.ve.tools.CreateTool, {
	constructor: function(data){
		
		this._resizable = "both";
	},
	
	 _create: function(args) {

        var command = this._getCreateCommand(args);
        this._context.getCommandStack().execute(command);
        this._select(this._mobileWidget);
    },

    _getCreateCommand: function(args){
		
		if(this._data.length !== 2){
			return;
		}
		
		var storeData = this._data[0]
		var edge2EdgeData = this._data[1];
		
		if(!this._context.loadRequires(storeData.type,true) ||
			!this._context.loadRequires(edge2EdgeData.type,true)){
			return;
		}
	
		var storeId = davinci.ve.widget.getUniqueObjectId(storeData.type, this._context.getDocument());
		if(!storeData.properties){
			storeData.properties = {};
		}
		storeData.properties.jsId = storeId;
		storeData.properties.id = storeId;
		storeData.context = this._context;
		
		var data = storeData.properties.data;
		var items = data.items;
		
		// Kludge to workaround lack of support for frames in dojo's ItemFileReadStore
		// Replaces objects and arrays in metadata that were created with the top context with ones created in the frame context
		var copyUsingFrameObject = dojo.hitch(this, function (items) {
			var win = this._context.getGlobal();
			var copyOfItems = win.eval("[]");
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var object = win.eval("new Object()");
				var copy = this._context.getDojo().mixin(object, item);
				copyOfItems.push(copy);
				if (copy.children) {
					copy.children = copyUsingFrameObject(copy.children);
				}
			}
			return copyOfItems;
		});
		data.items = copyUsingFrameObject(items);
		
		var edge2EdgeDataId = davinci.ve.widget.getUniqueObjectId(edge2EdgeData.type, this._context.getDocument());
		if(!edge2EdgeData.properties){
			edge2EdgeData.properties = { };
		}
		edge2EdgeData.context = this._context;
	
		var store = undefined;
		var edge2Edge = undefined;
		
		var dj = this._context.getDojo();
		dojo.withDoc(this._context.getDocument(), function(){
			store = davinci.ve.widget.createWidget(storeData);
			edge2EdgeData.properties.store = dj.getObject(storeId);
			edge2Edge = davinci.ve.widget.createWidget(edge2EdgeData);
		});
		
		if(!store || !edge2Edge){
			return;
		}
	
		var command = new davinci.commands.CompoundCommand();
		var index = args.index;
		// always put store and model as first element under body, to ensure they are constructed by dojo before they are used
        var bodyWidget = davinci.ve.widget.getWidget(this._context.rootNode);
		command.add(new davinci.ve.commands.AddCommand(store, bodyWidget, 0));
		index = (index !== undefined && index >= 0 ? index + 1 : undefined);
		command.add(new davinci.ve.commands.AddCommand(edge2Edge, args.parent, index));
		
		if(args.position){
			command.add(new davinci.ve.commands.MoveCommand(edge2Edge, args.position.x, args.position.y));
		}
		if(args.size){
			command.add(new davinci.ve.commands.ResizeCommand(edge2Edge, args.size.w, args.size.h));
		}
		
		this._mobileWidget = edge2Edge;
        return command;
		
	},
    
    addPasteCreateCommand: function(command, args){

        this._context = this._data.context;
        var storeId = this._data.properties.store._edit_object_id;
        var storeWidget = davinci.ve.widget.byId(storeId);
        var storeData = storeWidget.getData();
        var data = [];
        data[0] = storeData;
        data[1] = this._data;
        this._data = data;
        command.add( this._getCreateCommand(args));
        return this._mobileWidget;
        
   
    }
	

});
