$(function() {
  $("#ver-no-google").click(function() {
    var google_maps_iframe = '<iframe id="iframe-google-maps" width="100%" height="480" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com.br/maps?q=Rua+Sumidouro,+747&amp;hl=pt&amp;cid=1930265054114212525&amp;gl=BR&amp;t=m&amp;ie=UTF8&amp;ll=-23.564794,-46.702816&amp;spn=0.009441,0.013733&amp;z=16&amp;iwloc=A&amp;output=embed"></iframe>';

    $("#local address").after('<div style="margin: 20px 0">'+google_maps_iframe+'</div>');
    $("#ver-no-google").remove();

    return false;
  });
});
