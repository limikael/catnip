import {katnip, bindArgs, withTargetValue, TreeView, BsInput} from "katnip";
import {useRef} from "react";

export function CodeErrorModal({resolve, error}) {
	return (
		<div class="modal show fade" style={{display: "block", "background-color": "rgba(0,0,0,0.5)"}} aria-modal="true">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">XML Code Error</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
								onclick={bindArgs(resolve,false)}>
						</button>
					</div>
					<div class="modal-body">
						<p>Your XML code contains errors.</p>
						<p class="text-danger">{error}</p>
						<p>Do you want to continue edit to fix the errors, or revert to the last known good state?</p>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
								onclick={bindArgs(resolve,false)}>
							Continue Editing
						</button>
						<button type="button" class="btn btn-danger"
								onclick={bindArgs(resolve,true)}>
							Revert Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function EditorStructure({editor, contentEditor}) {
	let data=editor.getDoc();
	let ref=useRef();

	function ItemRenderer({data, path}) {
		let label;
		if (typeof data=="string")
			label="\u00ABtext\u00BB"

		else
			label=data.type;

		let cls="border border-primary bg-white shadow text-primary px-2 position-relative ";

		if (JSON.stringify(editor.startPath)==JSON.stringify(path))
			cls+="fw-bold"

		function onClick(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			editor.select(path);

			if (contentEditor.rightMode=="document")
				contentEditor.toggleRightMode("component");

			editor.focus();
		}

		let linkStyle={
			userSelect: "none",
			WebkitUserDrag: "none"
		};

		return (
			<div class={cls}>
				<a href="#"
						onclick={onClick}
						class="text-decoration-none stretched-link"
						draggable="false"
						style={linkStyle}>
					{label}
				</a>
			</div>
		);
	}

	function onChange(newData) {
		editor.setDoc(newData);
		editor.select();
	}

	function onClickOutside() {
		editor.select();
		editor.focus();
	}

	return (<>
		<div onclick={onClickOutside} style="height: 100%">
			<div class="mb-3"><b>Document</b></div>
			<div tabindex={0} ref={ref}>
				<TreeView
					data={data}
					itemHeight={25}
					itemSpacing={5}
					itemIndent={30}
					itemRenderer={ItemRenderer}
					itemWidth={100}
					onchange={onChange} />
			</div>
		</div>
	</>)
}

export function ComponentLibrary({editor, contentEditor}) {
	function onAddClick(componentName) {
		let c=[];
		if (katnip.elements[componentName].default)
			c=JSON.parse(JSON.stringify(katnip.elements[componentName].default));

		editor.addDocNodeAtCursor({
			"type": componentName,
			"props": {},
			"children": c
		});

		contentEditor.toggleLeftMode("tree");
		editor.focus();
	}

	return (<>
		<div class="mb-3"><b>Components</b></div>
		{Object.keys(katnip.elements).map((componentName)=>
			(!katnip.elements[componentName].internal &&
				<button class="btn btn-primary me-2 mb-2"
						onclick={bindArgs(onAddClick,componentName)}>
					{componentName}
				</button>
			)
		)}
	</>);
}

export function EditorPath({editor}) {
	function pathClick(path, ev) {
		ev.preventDefault();
		editor.select(path);
	}

	let path=editor.startPath;
	if (!path)
		path=[];

	let els=[];
	for (let i=0; i<path.length+1; i++) {
		let nodePath=path.slice(0,i);
		let node=editor.getDocNode(nodePath);
		let type="text";
		if (typeof node!="string")
			type=node.type;

		if (i)
			els.push(<span class="mx-1">&raquo;</span>);

		els.push(<a href="#" onclick={bindArgs(pathClick,nodePath)}>{type}</a>)
	}

	return els;
}

function ComponentControl({node, control, id, onchange, updateNodeProps}) {
	if (typeof control.type=="function") {
		let Control=control.type;

		function update(newValue) {
			updateNodeProps(id,newValue);
		}

		return (
			<Control 
				value={node.props[id]?node.props[id]:""}
				update={update}/>
		);
	}

	return (
		<BsInput {...control} 
				value={node.props[id]?node.props[id]:""}
				onchange={onchange}
				data-id={id}/>
	);
}


export function ComponentProperties({editor}) {
	let path=editor.startPath;
	let node=editor.getDocNode(path);
	while (path.length && typeof node=="string") {
		path=path.slice(0,path.length-1);
		node=editor.getDocNode(path);
	}

	if (!node || !katnip.elements[node.type])
		return;

	function updateNodeProps(prop, value) {
		let props=editor.getDocNode(path).props;
		props[prop]=value;
		editor.setDocNodeProps(path,props);
	}

	function onPropChange(ev) {
		updateNodeProps(ev.target.dataset.id,ev.target.value);
	}

	let controls=katnip.elements[node.type].controls;

	return <>
		<div class="mb-3"><b>{node.type}</b></div>
		{Object.entries(controls).map(([id,control])=>
			<div class="form-group mb-3">
				<label class="d-block form-label mb-1">{control.title}</label>
				<ComponentControl
						node={node}
						control={control}
						id={id}
						onchange={onPropChange}
						updateNodeProps={updateNodeProps}/>
			</div>
		)}
	</>;
}

export function CodeEditor({contentEditor}) {
	function onKeyDown(ev) {
		if (ev.key=="Tab") {
			ev.preventDefault();

			let start=ev.target.selectionStart;
			let end=ev.target.selectionEnd;

			ev.target.value=ev.target.value.substring(0,start)+
				"\t"+ev.target.value.substring(end);

			ev.target.selectionStart=ev.target.selectionEnd=start+1;
		}
	}

	return (
		<div style="width: 100%; height: 100%" class="p-3">
			<textarea style="width: 100%; height: 100%; resize: none; border: none; tab-size: 2"
					class="bg-dark text-white form-control font-monospace lh-sm"
					onchange={withTargetValue(contentEditor.setXml)}
					onkeydown={onKeyDown}>
				{contentEditor.xml}
			</textarea>
		</div>
	)
}

export function CodeEditorStatus({contentEditor}) {
	if (contentEditor.error)
		return <span class="text-danger">{contentEditor.error}</span>

	else
		return <b>Document Ok.</b>
}
