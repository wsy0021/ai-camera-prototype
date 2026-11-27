const commerceCategories=[['recommend','推荐'],['selling','视频带货'],['drama','剧情带货'],['store','探店视频'],['montage','创意混剪'],['detail','电商详图'],['short','AI短剧'],['novel','小说推文'],['text-video','文生视频'],['image-video','图生视频'],['fun','趣味视频'],['dance','照片跳舞'],['portrait','写真大片'],['idphoto','证件照']];
const commerceItems=[
 ['c-skin','一瓶精华的晨间出场','skincare.jpg','selling','护肤好物'],
 ['c-coffee','打工人的第一杯咖啡','coffee.jpg','drama','生活剧情'],
 ['c-perfume','把香气拍成一段故事','perfume.jpg','selling','香氛展示'],
 ['c-shoe','出门前的最后一秒','shoes.jpg','drama','反转剧情'],
 ['c-chair','一把椅子的居家时光','chair.jpg','selling','家居场景'],
 ['c-beauty','化妆包里有什么','cosmetics.jpg','montage','好物混剪'],
 ['c-tea','藏在街角的一杯茶','tea.jpg','store','茶饮探店'],
 ['c-bag','通勤包的收纳秘密','bag.jpg','detail','细节展示'],
 ['c-short','下班后的便利店','story.svg','short','生活短剧'],
 ['c-novel','重逢在雨夜','novel.svg','novel','故事推文'],
 ['c-text','写一句话，拍一段日常','tea.jpg','text-video','文字创意'],
 ['c-image','让静物有了镜头感','perfume.jpg','image-video','静物运镜'],
 ['c-fun','今天的主角是咖啡','coffee.jpg','fun','趣味创意'],
 ['c-dance','让照片跟上节拍','dance.svg','dance','动态创意'],
 ['c-portrait','周末的光','portrait.svg','portrait','写真灵感'],
 ['c-id','新的开始','idphoto.svg','idphoto','简洁人像']
].map(([id,title,file,group,sub])=>({id,title,img:'../assets/commerce/'+file,group,sub,type:'video'}));
