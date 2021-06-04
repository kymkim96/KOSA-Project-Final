from flask import Flask, render_template

app = Flask(__name__,
            instance_relative_config=False,
            static_url_path='/static')


@app.route('/')
def hello_world():
    return render_template('index.html')


with app.app_context():
    from view import routes


if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=True)
