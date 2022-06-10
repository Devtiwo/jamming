let accessToken;
const clientId = '9e64f661ce6d43d6ae763d38aa4de4a0';
const redirectUri = 'https://jammingplaylist.netlify.app';
 
const Spotify = {
    getAccessToken() {
      if(accessToken) {
        return accessToken;
      }

      const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
      const expires = window.location.href.match(/expires_in=([^&]*)/);

      if (accessTokenMatch && expires) {
          accessToken = accessTokenMatch[1];
          const expiresIn = Number(expires[1]);
          window.setTimeout(() => accessToken = '', expiresIn * 1000);
          window.history.pushState('Access Token', null, '/');
          return accessToken;
      } else {
          const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
          window.location = accessUrl;
      }
    },

    search(term) {
      const accessToken = Spotify.getAccessToken();
      return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`,
      {
        headers: {Authorization: `Bearer ${accessToken}`}
      }).then(response => {
          return response.json();
      }).then(jsonResponse => {
          if (!jsonResponse.tracks) {
              return [];
          }
          return jsonResponse.tracks.items.map(track => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              uri: track.uri
          }));
      });
    },

    savePlaylist(name, trackUris) {
      if(!name || !trackUris.length) {
        return;
      }

      const accessToken = Spotify.getAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      let userId;

      return fetch('https://api.spotify.com/v1/me', { headers: headers }
      ).then(response => response.json()
      ).then(jsonResponse => {
          userId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ name: name })
        }).then(response => response.json()
        ).then(jsonResponse => {
          const playlistID = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistID}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackUris })
          });
        });
      });
      
    }
};

export default Spotify;